package microservice.admin.api

object GetPendingSubmissionsEndpoint {
  val name: String = "GetPendingSubmissions"
  val method: String = "GET"
  val path: String = "/admin/submissions/pending"
  val businessLogic: String =
    "管理员读取 pending_review submissions，并附带关联 level 对象。"
}
