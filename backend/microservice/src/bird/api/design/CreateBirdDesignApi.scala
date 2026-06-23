package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.design.{BirdDesign, BirdDesignInput}
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdDesignRow, BirdRowMapper}
import microservice.bird.validation.design.BirdDesignValidation
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}
import microservice.bird.body.design.CreateBirdDesignBody

/** 设计师创建新鸟类设计 APIMessage，初始状态为 Draft。 */
final case class CreateBirdDesignAPIMessage(designerId: String, body: CreateBirdDesignBody)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  /** plan 定义了什么业务流程：Designer 创建新鸟设计，校验字段后写入 BirdDesignTable，status=Draft。
    *
    * 解决了什么问题：UGC 鸟种需由设计师定义属性、三档技能描述与预览图。
    * 在事务内起到什么作用：校验通过后 insert BirdDesignRow；失败则整笔回滚。
    * 关联的 HTTP 路由/前端 API：POST /designer/bird-designs；前端 `CreateBirdDesignApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Designer 角色
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：校验 name/summary/stats/tierSkills 等字段
        input <- BirdDesignValidation.validate(toInput(body))
        // 步骤 3：校验通过后 insert BirdDesignRow
        design <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val row = BirdDesignTable.insert(
            connection,
            BirdDesignRow(
              id = BirdDesignTable.nextId(connection),
              authorId = designerId,
              name = input.name,
              summary = input.summary,
              skillName = input.skillName,
              attack = input.attack,
              impact = input.impact,
              speed = input.speed,
              tierSkillsJson = BirdRowMapper.encodeStringList(input.tierSkills),
              previewImageUrl = input.previewImageUrl.filter(_.trim.nonEmpty).map(_.trim).getOrElse(BirdDesignTable.defaultPreviewImageUrl),
              mechanismTagsJson = BirdRowMapper.encodeStringList(input.mechanismTags),
              status = LevelStatus.Draft,
              rejectionReason = None,
              createdAt = timestamp,
              updatedAt = timestamp,
              publishedAt = None
            )
          )
          BirdRowMapper.toBirdDesign(row)
        }
      } yield design
    }

  /** 将 HTTP 请求体映射为校验层使用的 BirdDesignInput（字段一一对应，无业务变换）。 */
  private def toInput(body: CreateBirdDesignBody): BirdDesignInput =
    BirdDesignInput(
      name = body.name,
      summary = body.summary,
      skillName = body.skillName,
      attack = body.attack,
      impact = body.impact,
      speed = body.speed,
      tierSkills = body.tierSkills,
      previewImageUrl = body.previewImageUrl,
      mechanismTags = body.mechanismTags
    )
}
