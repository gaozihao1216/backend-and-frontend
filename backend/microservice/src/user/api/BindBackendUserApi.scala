package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.objects.BackendUser
import microservice.user.tables.user.{UserRow, UserTable}
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.tables.user.UserRowMapper
import microservice.user.api.validation.BindBackendUserValidation
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
        validated <- BindBackendUserValidation.validate(request)
        user <- PlanSteps.read {
          val normalizedNickname = validated.nickname.trim

          val suffix =
            math.abs(validated.localUserId.trim.hashCode).toString.take(7).reverse.padTo(7, '0').reverse
          val username = s"local-${validated.role.value}-$suffix"

          val resolvedUser = UserTable.findByUsername(connection, username).getOrElse {
            val timestamp = Instant.now().toString
            UserTable.insert(
              connection,
              UserRow(
                id = s"${validated.role.value}-${UserTable.countByRole(connection, validated.role) + 1}",
                username = username,
                displayName = normalizedNickname,
                role = validated.role,
                adminLevel = if (validated.role == UserRole.Admin) Some(AdminLevel.Standard) else None,
                createdAt = timestamp,
                updatedAt = timestamp
              )
            )
          }

          UserRowMapper.toBackendUser(resolvedUser)
        }
      } yield user
    }
}
