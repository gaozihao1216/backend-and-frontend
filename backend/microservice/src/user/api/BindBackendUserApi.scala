package microservice.user.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.user.objects.{BackendUser, BindBackendUserErrors}
import microservice.user.tables.user.{UserRow, UserTable}
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.tables.user.UserRowMapper
import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /auth/bind 的请求体：前端 mock 登录后的本地身份信息。 */
final case class BindBackendUserRequest(
  localUserId: String, // 浏览器 localStorage 中的稳定本地 ID
  nickname: String,    // 展示名，写入 UserRow.displayName
  role: UserRole         // player / designer / admin
)

object BindBackendUserRequest {
  implicit val decoder: Decoder[BindBackendUserRequest] = deriveDecoder
  implicit val encoder: Encoder[BindBackendUserRequest] = deriveEncoder
  // http4s 从 HTTP body 自动解码时使用
  implicit val entityDecoder: EntityDecoder[IO, BindBackendUserRequest] = jsonOf
}

/** 绑定（或创建）后端用户的 APIMessage。
  *
  * 返回 BackendUser 供前端保存 apiUserId，后续请求在 x-user-id 中携带。
  */
final case class BindBackendUserAPIMessage(
  request: BindBackendUserRequest
) extends APIMessage[BackendUser] {

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
