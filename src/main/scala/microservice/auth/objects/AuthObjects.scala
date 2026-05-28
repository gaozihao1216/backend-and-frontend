package microservice.auth.objects

import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class BackendUser(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  createdAt: String,
  updatedAt: String
)

object BackendUser {
  implicit val encoder: Encoder[BackendUser] = deriveEncoder
  implicit val decoder: Decoder[BackendUser] = deriveDecoder
}
