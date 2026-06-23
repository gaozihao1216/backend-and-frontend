package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.submission.BirdSubmission
import microservice.bird.support.design.BirdDesignAccess
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.UserRole

/** 将 Draft/Rejected 设计提交审核：设计进入 PendingReview，并创建 BirdSubmission 记录。
  *
  * 实现：校验所有权、无重复 pending 投稿、状态可提交 → updateSubmissionStatus + BirdSubmissionTable.insert。
  * 关联：POST /designer/bird-designs/:designId/submit；审核由 ReviewBirdSubmissionAPIMessage 处理。
  */
final case class SubmitBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdSubmission] {
  override def token: String = designerId
  /** plan 定义了什么业务流程：SubmitBirdDesign 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的 HTTP 路由/前端 API：见 routes 中对应路径；前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, BirdSubmission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Designer
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：确认设计处于可提交状态且无重复待审投稿
        _ <- BirdDesignAccess.requireSubmittable(connection, designerId, designId)
        // 步骤 3：更新设计状态并创建 BirdSubmission 记录
        submission <- BirdDesignAccess.requireSubmitResult(connection, designerId, designId)
      } yield submission
    }
}
