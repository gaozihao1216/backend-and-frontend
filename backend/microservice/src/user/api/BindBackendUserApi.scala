package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.objects.{BackendUser, BindBackendUserErrors}
import microservice.user.tables.user.{UserRow, UserTable}
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.tables.user.UserRowMapper
import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole

/** 绑定（或创建）后端用户的 APIMessage。
  *
  * 定义：包装 [[BindBackendUserRequest]]，返回 [[BackendUser]]。
  * 问题：同一 localUserId 多次 bind 应幂等得到同一后端用户而非重复 insert。
  * 作用：校验 → 确定性 username → findOrInsert → RowMapper。
  * 关联：POST /auth/bind 201 Created；[[UserTable.findByUsername]]。
  */
final case class BindBackendUserAPIMessage(
  request: BindBackendUserRequest
) extends APIMessage[BackendUser] {

  /** plan 实现：校验 → 生成 username → 查或建用户 → 映射 BackendUser。
    *
    * 定义：PlanSteps.finish + require + read 组合。
    * 问题：空 localUserId/nickname 需 400；admin bind 默认 standard 等级。
    * 作用：返回 apiUserId 供前端持久化到 localStorage。
    * 关联：[[BindBackendUserErrors]]、[[UserRowMapper]]。
    */
  override def plan(connection: Connection): IO[Either[HttpError, BackendUser]] =
    PlanSteps.finish {
      for {
        // --- 1. 基础字段校验 ---
        _ <- PlanSteps.require(
          if (request.localUserId.trim.isEmpty || request.nickname.trim.isEmpty) {
            Left(BindBackendUserErrors.BindBackendUserValidation(List("localUserId", "nickname")).toHttpError)
          } else {
            Right(())
          }
        )
        user <- PlanSteps.read {
          val normalizedNickname = request.nickname.trim

          // --- 2. 由 localUserId 生成确定性 username，保证同一本地身份多次 bind 得到同一后端用户 ---
          val suffix =
            math.abs(request.localUserId.trim.hashCode).toString.take(7).reverse.padTo(7, '0').reverse
          val username = s"local-${request.role.value}-$suffix"

          // --- 3. 查已有用户；不存在则按 role 计数生成 id 并 insert ---
          val resolvedUser = UserTable.findByUsername(connection, username).getOrElse {
            val timestamp = Instant.now().toString
            UserTable.insert(
              connection,
              UserRow(
                id = s"${request.role.value}-${UserTable.countByRole(connection, request.role) + 1}",
                username = username,
                displayName = normalizedNickname,
                role = request.role,
                // 通过 bind 新建的 admin 默认为 standard；director 由 seed/SQL 预置
                adminLevel = if (request.role == UserRole.Admin) Some(AdminLevel.Standard) else None,
                createdAt = timestamp,
                updatedAt = timestamp
              )
            )
          }

          // --- 4. Row → 对外 API 对象 ---
          UserRowMapper.toBackendUser(resolvedUser)
        }
      } yield user
    }
}
