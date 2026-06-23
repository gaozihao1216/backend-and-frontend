package microservice.level.api.internal.user

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.user.UserLevelProfileData
import microservice.level.support.user.UserProfileReadSupport

/** 模块间 API：加载用户资料页 level 侧数据；由 user HTTP API 调用，不挂路由。 */
final case class GetUserLevelProfileDataInternalAPIMessage(userId: String) extends APIMessage[UserLevelProfileData] {
  override def plan(connection: Connection): IO[Either[HttpError, UserLevelProfileData]] =
    PlanSteps.finish {
      PlanSteps.read(UserProfileReadSupport.loadForUser(connection, userId))
    }
}
