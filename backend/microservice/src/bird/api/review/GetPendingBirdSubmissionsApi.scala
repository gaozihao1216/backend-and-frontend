package microservice.bird.api.review

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.submission.BirdSubmissionWithDesign
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.BirdRowMapper
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel

/** 列出待审核鸟类设计投稿 APIMessage，附带关联 BirdDesign 快照。 */
final case class GetPendingBirdSubmissionsAPIMessage(userId: String)
    extends APIWithTokenMessage[List[BirdSubmissionWithDesign]] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员获取 PendingReview 鸟类投稿及对应设计详情。
    *
    * 解决了什么问题：审核页需同时展示投稿与设计属性，避免二次请求。
    * 在事务内起到什么作用：只读联查 BirdSubmissionTable + BirdDesignTable。
    * 关联的 HTTP 路由/前端 API：GET /admin/bird-submissions/pending；前端 admin 鸟审核页。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[BirdSubmissionWithDesign]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Standard 管理员权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        // 步骤 2：列出待审投稿，逐条 join BirdDesign 组装 BirdSubmissionWithDesign
        submissions <- PlanSteps.read(
          BirdSubmissionTable
            .listPending(connection)
            .flatMap { submission =>
              BirdDesignTable.findById(connection, submission.birdDesignId).map { design =>
                BirdSubmissionWithDesign.from(
                  BirdRowMapper.toBirdSubmission(submission),
                  BirdRowMapper.toBirdDesign(design)
                )
              }
            }
            .toList
        )
      // 返回待审鸟类投稿+设计列表
      } yield submissions
    }
}
