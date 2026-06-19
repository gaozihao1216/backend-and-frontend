package microservice.admin.api.comments

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
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
        // 步骤 1：校验 Standard 管理员权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        // 步骤 2：按 commentId 删除；不存在则 COMMENT_NOT_FOUND
        comment <- PlanSteps.require(
          CommentTable.deleteById(connection, commentId)
            .map(LevelRowMapper.toComment)
            .toRight(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
        )
      // 返回已删除的评论对象，便于前端展示确认信息
      } yield comment
    }
}
