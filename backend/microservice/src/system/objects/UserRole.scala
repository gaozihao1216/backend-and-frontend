package microservice.system.objects

import io.circe.{Decoder, Encoder}

sealed trait UserRole {
  def value: String
}

object UserRole {
  case object Player extends UserRole { override val value: String = "player" }
  case object Designer extends UserRole { override val value: String = "designer" }
  case object Admin extends UserRole { override val value: String = "admin" }

  private val byValue = List(Player, Designer, Admin).map(role => role.value -> role).toMap

  def fromString(value: String): Option[UserRole] =
    byValue.get(value)

  implicit val encoder: Encoder[UserRole] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[UserRole] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown user role: $value"))
}
