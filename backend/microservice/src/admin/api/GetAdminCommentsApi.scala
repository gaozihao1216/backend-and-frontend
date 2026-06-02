package microservice.admin.api

object GetAdminCommentsEndpoint {
  val name: String = "GetAdminComments"
  val method: String = "GET"
  val path: String = "/admin/comments"
  val businessLogic: String =
    "管理员读取全量评论，按创建时间倒序排列。"
}
