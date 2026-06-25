package microservice.user.routes

import io.circe.generic.auto._
import microservice.infrastructure.api.RegisteredAPIMessage
import microservice.infrastructure.api.RegisteredAPIMessage.{protectedApi, publicApi}
import microservice.user.api.{BindBackendUserAPIMessage, GetBackendUsersAPIMessage, GetUserProfileAPIMessage}
import microservice.user.objects.identity.BackendUser
import microservice.user.objects.profile.UserProfile
import org.http4s.Status

object UserApiMessages {
  val apiMessages: List[RegisteredAPIMessage] = List(
    publicApi[GetBackendUsersAPIMessage, List[BackendUser]](),
    publicApi[BindBackendUserAPIMessage, BackendUser](successStatus = Status.Created),
    protectedApi[GetUserProfileAPIMessage, UserProfile](identityFields = List("viewerUserId"))
  )
}
