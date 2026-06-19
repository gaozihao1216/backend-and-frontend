package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.objects.BackendUser
import microservice.user.tables.user.UserTable
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.tables.user.UserRowMapper

/** GET /auth/backend-users 的 APIMessage。
  *
  * 定义：无入参 APIMessage，返回 List[[BackendUser]]。
  * 问题：演示环境需列出可绑定账号供前端选择 mock 身份。
  * 作用：UserTable.listAll → UserRowMapper 批量转换。
  * 关联：[[AuthRouter]] GET /auth/backend-users；[[SystemDemoData.users]] 种子。
  */
final case class GetBackendUsersAPIMessage() extends APIMessage[List[BackendUser]] {

  /** plan 实现：全表扫描用户（演示无分页/无鉴权）。
    *
    * 定义：单步 PlanSteps.read。
    * 问题：生产环境应移除此接口或加管理员鉴权。
    * 作用：返回当前库中全部 BackendUser。
    * 关联：[[UserTable.listAll]]。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[BackendUser]]] =
    PlanSteps.finish {
      // --- 1. 列出全部用户并映射为 API 对象 ---
      PlanSteps.read(
        UserTable
          .listAll(connection)
          .map(UserRowMapper.toBackendUser)
          .toList
      )
    }
}
