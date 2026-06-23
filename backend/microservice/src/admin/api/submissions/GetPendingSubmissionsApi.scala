package microservice.admin.api.submissions

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.AdminLevel

/** 列出所有待审核关卡投稿 APIMessage，附带关联关卡快照。 */
final case class GetPendingSubmissionsAPIMessage(userId: String) extends APIWithTokenMessage[List[SubmissionWithLevel]] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员获取 PendingReview 状态的关卡投稿及对应 Level 详情。
    *
    * 解决了什么问题：审核页需要同时展示投稿元数据与关卡标题/内容，避免二次请求。
    * 在事务内起到什么作用：只读联查 SubmissionTable + LevelTable；无写入。
    * 关联的 HTTP 路由/前端 API：GET /admin/submissions/pending；前端 `GetPendingSubmissionsApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[SubmissionWithLevel]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Standard 管理员权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        // 步骤 2：列出待审投稿，逐条 join Level 并组装 SubmissionWithLevel
        submissions <- PlanSteps.read(
          SubmissionTable.listPending(connection)
            .flatMap { submission =>
              LevelTable.findById(connection, submission.levelId).map { level =>
                SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
              }
            }
            .toList
        )
      // 返回待审投稿+关卡列表，供审核队列页渲染
      } yield submissions
    }
}
