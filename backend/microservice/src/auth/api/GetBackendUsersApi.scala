package microservice.auth.api

object GetBackendUsersEndpoint {
  val name: String = "GetBackendUsers"
  val method: String = "GET"
  val path: String = "/auth/backend-users"
  val businessLogic: String =
    "返回当前系统内可绑定的后端用户列表。"
}
