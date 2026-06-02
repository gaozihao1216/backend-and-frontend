package microservice.admin.api

object GetAdminCommentsEndpoint {
  val name: String = "GetAdminComments"
  val method: String = "GET"
  val path: String = "/admin/comments"
  val businessLogic: String =
    "管理员读取全量评论，按创建时间倒序排列。"
}

object DeleteCommentEndpoint {
  val name: String = "DeleteComment"
  val method: String = "DELETE"
  val path: String = "/admin/comments/:commentId"
  val businessLogic: String =
    "管理员按 commentId 删除评论并返回被删除的评论对象。"
}
