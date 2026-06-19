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

/** 获取全部鸟种技能配置看板 APIMessage。 */
final case class GetDirectorBirdSkillBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorBirdSkillBoard] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 拉取所有鸟种的技能配置状态（已配置/默认预览）。
    *
    * 解决了什么问题：总监需一览系统鸟与设计师鸟的技能 JSON 配置进度。
    * 在事务内起到什么作用：只读；委托 DirectorBirdSkillSupport.buildBoard。
    * 关联的 HTTP 路由/前端 API：GET /admin/director/bird-skills/board。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillBoard]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 步骤 2：组装技能看板
        board <- PlanSteps.read(DirectorBirdSkillSupport.buildBoard(connection))
      // 返回鸟种技能看板 DTO
      } yield board
    }
}

/** 保存/更新指定鸟种技能配置 APIMessage（upsert BirdSkillConfigTable）。 */
final case class SaveDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String,
  body: SaveDirectorBirdSkillBody
) extends APIWithTokenMessage[BirdSkillConfig] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 为某 birdType 写入 skills JSON 与可选模型图 URL。
    *
    * 解决了什么问题：玩家侧鸟技能行为需由总监可配置，且须校验 JSON 结构。
    * 在事务内起到什么作用：校验通过后 upsert BirdSkillConfigTable；失败则回滚。
    * 关联的 HTTP 路由/前端 API：PUT /admin/director/bird-skills/:birdType。
    */
  override def plan(connection: Connection): IO[Either[HttpError, BirdSkillConfig]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 步骤 2：birdType 须在 PlayerPreparationCatalog 中存在
        _ <- PlanSteps.require(
          PlayerPreparationCatalog.find(connection, birdType).toRight(
            HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
          ).map(_ => ())
        )
        // 步骤 3：校验 skills JSON 含非空 stages 数组
        skills <- PlanSteps.require(DirectorBirdSkillSupport.validateSkillsJson(body.skills))
        // 步骤 4：upsert BirdSkillConfig 并返回
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
      // 返回保存后的技能配置领域对象
      } yield config
    }
}

/** 获取单个鸟种技能配置详情 APIMessage（含默认 preview 与 configured 标志）。 */
final case class GetDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String
) extends APIWithTokenMessage[DirectorBirdSkillEntry] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 查看某 birdType 的技能详情页数据。
    *
    * 解决了什么问题：编辑单鸟技能前需展示 catalog 元数据与已存 JSON 的合并视图。
    * 在事务内起到什么作用：只读 catalog + BirdSkillConfigTable.findByBirdType。
    * 关联的 HTTP 路由/前端 API：GET /admin/director/bird-skills/:birdType。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillEntry]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 步骤 2：birdType 须在 catalog 中存在
        entry <- PlanSteps.require(
          PlayerPreparationCatalog.find(connection, birdType).toRight(
            HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
          )
        )
        // 步骤 3：合并 catalog 与已存配置，构造 DirectorBirdSkillEntry
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
      // 返回单鸟技能详情 DTO
      } yield skillEntry
    }
}
