package microservice.admin.api

object DeleteCommentEndpoint {
  val name: String = "DeleteComment"
  val method: String = "DELETE"
  val path: String = "/admin/comments/:commentId"
  val businessLogic: String =
    "管理员按 commentId 删除评论并返回被删除的评论对象。"
}
