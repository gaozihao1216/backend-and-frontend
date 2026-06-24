package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.design.BirdDesign
import microservice.bird.support.design.BirdDesignAccess
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.UserRole

/** DELETE /designer/bird-designs/:designId — 删除草稿状态的鸟类设计（仅作者、仅 Draft）。 */
final case class DeleteBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  /** plan 定义了什么业务流程：Designer 删除自己名下 Draft 状态的鸟类设计。
    *
    * 关联的前端 API：DELETE /designer/bird-designs/:designId；前端 `DeleteBirdDesignApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Designer
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：确认设计可删除（作者匹配且为 Draft）
        existing <- BirdDesignAccess.requireDeletable(connection, designerId, designId)
        // 步骤 3：执行删除并返回被删设计快照
        design <- BirdDesignAccess.requireDeleteResult(connection, designId, designerId, existing)
      } yield design
    }
}
