package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.admin.support.director.bird_skill.DirectorBirdSkillSupport
import microservice.bird.objects.skill.{BirdSkillConfig, DirectorBirdSkillBoard, DirectorBirdSkillEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationCatalog
import microservice.system.objects.AdminLevel

/** 获取全部鸟种技能配置看板。
  *
  * 关联：GET /admin/director/bird-skills/board。
  */
final case class GetDirectorBirdSkillBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorBirdSkillBoard] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillBoard]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        board <- PlanSteps.read(DirectorBirdSkillSupport.buildBoard(connection))
      } yield board
    }
}

/** 保存/更新指定鸟种的技能配置（upsert BirdSkillConfigTable）。
  *
  * 实现：requireAdminLevel(Director) → 校验 birdType 存在于 PlayerPreparationCatalog → validateSkillsJson → upsert。
  * 关联：PUT /admin/director/bird-skills/:birdType。
  */
final case class SaveDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String,
  body: SaveDirectorBirdSkillBody
) extends APIWithTokenMessage[BirdSkillConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, BirdSkillConfig]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        _ <- PlanSteps.require(
          PlayerPreparationCatalog.find(connection, birdType).toRight(
            HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
          ).map(_ => ())
        )
        skills <- PlanSteps.require(DirectorBirdSkillSupport.validateSkillsJson(body.skills))
        config <- PlanSteps.read(
          BirdSkillConfigTable.upsert(
            connection,
            BirdSkillConfig(
              birdType = birdType,
              skills = skills,
              modelImageUrl = body.modelImageUrl.filter(_.trim.nonEmpty),
              updatedById = Some(userId),
              updatedAt = BirdSkillConfigTable.nowIso
            )
          )
        )
      } yield config
    }
}

/** 获取单个鸟种的技能配置详情（含默认 preview 与 configured 标志）。
  *
  * 关联：GET /admin/director/bird-skills/:birdType。
  */
final case class GetDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String
) extends APIWithTokenMessage[DirectorBirdSkillEntry] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillEntry]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        entry <- PlanSteps.require(
          PlayerPreparationCatalog.find(connection, birdType).toRight(
            HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
          )
        )
        skillEntry <- PlanSteps.read {
          val config = BirdSkillConfigTable.findByBirdType(connection, birdType)
          DirectorBirdSkillEntry(
            birdType = entry.birdType,
            name = entry.name,
            source = entry.source,
            authorId = entry.authorId,
            skillName = entry.skillName,
            tierSkillDescriptions = entry.tierSkillDescriptions.toList,
            configured = config.isDefined,
            skills = config.map(_.skills),
            modelImageUrl = config.flatMap(_.modelImageUrl).orElse(Some(entry.previewImageUrl))
          )
        }
      } yield skillEntry
    }
}
