package microservice.admin.api.comments

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.objects.social.LevelComment
import microservice.admin.support.comments.AdminCommentAccess
import microservice.system.objects.AdminLevel

/** 按 ID 删除单条关卡评论 APIMessage。 */
final case class DeleteCommentAPIMessage(
  userId: String,
  commentId: String
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员删除指定评论，返回被删记录快照。
    *
    * 解决了什么问题：违规或垃圾评论需从后台移除，且前端需确认删除内容。
    * 在事务内起到什么作用：权限校验通过后执行 CommentTable.deleteById；找不到则 Left 回滚。
    * 关联的 HTTP 路由/前端 API：DELETE /admin/comments/:commentId；前端 `DeleteCommentApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        comment <- AdminCommentAccess.requireDeletedComment(connection, commentId)
      } yield comment
    }
}
