package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.objects.UserProfile
import microservice.user.support.UserProfileAccess
import microservice.user.support.AccessControl

/** GET /users/:profileUserId/profile 的 APIMessage。 */
final case class GetUserProfileAPIMessage(
  viewerUserId: String,
  profileUserId: String
) extends APIWithTokenMessage[UserProfile] {
  override def token: String = viewerUserId

  /** plan 定义了什么业务流程：已登录用户查看指定用户的公开资料页。
    *
    * 关联的前端 API：GET /users/:profileUserId/profile；前端 `GetUserProfileApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, UserProfile]] =
    PlanSteps.finish {
      for {
        // 步骤 1：确认 viewer 为已知用户
        _ <- AccessControl.requireKnownUser(connection, viewerUserId).map(_ => ())
        // 步骤 2：聚合查询目标用户的 UserProfile
        profile <- UserProfileAccess.requireProfile(connection, profileUserId)
      } yield profile
    }
}
