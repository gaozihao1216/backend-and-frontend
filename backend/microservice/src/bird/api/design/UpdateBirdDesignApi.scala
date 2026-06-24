package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.design.{BirdDesign, BirdDesignInput}
import microservice.bird.support.design.BirdDesignAccess
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.bird.validation.design.BirdDesignValidation
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}
import microservice.bird.body.design.UpdateBirdDesignBody

/** 更新鸟类设计：仅作者可编辑 Draft/Rejected 状态的设计，保存后重置为 Draft。
  *
  * 实现：校验所有权与状态 → validate → BirdDesignTable.updateEditable。
  * 关联：PUT /designer/bird-designs/:designId。
  */
final case class UpdateBirdDesignAPIMessage(designerId: String, designId: String, body: UpdateBirdDesignBody)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId
  /** plan 定义了什么业务流程：UpdateBirdDesign 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的前端 API：前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：执行业务步骤
        existing <- BirdDesignAccess.requireEditable(connection, designerId, designId)
        // 步骤 3：执行业务步骤
        input <- BirdDesignValidation.validate(
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
        )
        // 步骤 4：执行业务步骤
        design <- BirdDesignAccess.requireUpdateResult(
          connection,
          {
            val timestamp = Instant.now().toString
            existing.copy(
              name = input.name,
              summary = input.summary,
              skillName = input.skillName,
              attack = input.attack,
              impact = input.impact,
              speed = input.speed,
              tierSkillsJson = BirdDesignTable.encodeStringList(input.tierSkills),
              previewImageUrl = input.previewImageUrl.filter(_.trim.nonEmpty).map(_.trim).getOrElse(existing.previewImageUrl),
              mechanismTagsJson = BirdDesignTable.encodeStringList(input.mechanismTags),
              status = LevelStatus.Draft,
              rejectionReason = None,
              updatedAt = timestamp
            )
          }
        )
      } yield design
    }
}
