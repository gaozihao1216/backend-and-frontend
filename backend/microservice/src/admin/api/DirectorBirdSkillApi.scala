package microservice.admin.api

import cats.effect.IO
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._
import io.circe.syntax._
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.{BirdSkillConfig, DirectorBirdSkillBoard, DirectorBirdSkillEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationCatalog
import microservice.system.objects.AdminLevel
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf
import org.http4s.circe._

/** 总监鸟类技能配置的共享逻辑：组装看板、校验 skills JSON 结构。
  *
  * 实现：buildBoard 合并 PlayerPreparationCatalog 条目与 BirdSkillConfigTable 已配置技能；
  *       validateSkillsJson 要求 skills.stages 为非空数组。
  * 关联：GetDirectorBirdSkillBoardAPIMessage、SaveDirectorBirdSkillAPIMessage。
  */
object DirectorBirdSkillSupport {
  /** 构建全部鸟种的技能配置看板（含系统鸟与设计师发布鸟）。 */
  def buildBoard(connection: Connection): DirectorBirdSkillBoard = {
    val configured = BirdSkillConfigTable.skillsJsonMap(connection)
    val birds =
      PlayerPreparationCatalog.loadEntries(connection).map { entry =>
        val config = configured.get(entry.birdType)
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
      }.toList
    DirectorBirdSkillBoard(birds = birds)
  }

  /** 校验 skills JSON：必须包含非空 stages 数组，供 SaveDirectorBirdSkill 写入前使用。 */
  def validateSkillsJson(skills: Json): Either[HttpError, Json] =
    skills.hcursor.downField("stages").focus match {
      case None => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages is required"))
      case Some(stages) if !stages.isArray => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must be an array"))
      case Some(stages) if stages.asArray.exists(_.isEmpty) =>
        Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must not be empty"))
      case _ => Right(skills)
    }
}

/** 获取全部鸟种技能配置看板。
  *
  * 关联：GET /admin/director/bird-skills/board。
  */
final case class GetDirectorBirdSkillBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorBirdSkillBoard] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillBoard]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map { _ =>
        DirectorBirdSkillSupport.buildBoard(connection)
      }
    }
}

/** 保存某鸟种技能 JSON 与可选模型图 URL 的请求体。 */
final case class SaveDirectorBirdSkillBody(
  skills: Json,
  modelImageUrl: Option[String] = None
)

object SaveDirectorBirdSkillBody {
  implicit val encoder: Encoder[SaveDirectorBirdSkillBody] = deriveEncoder
  implicit val decoder: Decoder[SaveDirectorBirdSkillBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[cats.effect.IO, SaveDirectorBirdSkillBody] = jsonOf
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
    IO.pure {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        entry <- PlayerPreparationCatalog.find(connection, birdType).toRight(
          HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
        )
        skills <- DirectorBirdSkillSupport.validateSkillsJson(body.skills)
      } yield BirdSkillConfigTable.upsert(
          connection,
          BirdSkillConfig(
            birdType = birdType,
            skills = skills,
            modelImageUrl = body.modelImageUrl.filter(_.trim.nonEmpty),
            updatedById = Some(userId),
            updatedAt = BirdSkillConfigTable.nowIso
          )
        )
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
    IO.pure {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        entry <- PlayerPreparationCatalog.find(connection, birdType).toRight(
          HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
        )
      } yield {
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
    }
}
