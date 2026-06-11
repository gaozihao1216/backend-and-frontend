package microservice.ui.objects

/** 页面所属角色端点：player / designer / admin / director，用于按角色过滤页面列表。 */
import io.circe.{Decoder, Encoder}

sealed trait UiEndpoint {
  def value: String
}

object UiEndpoint {
  case object Player extends UiEndpoint { override val value: String = "player" }
  case object Designer extends UiEndpoint { override val value: String = "designer" }
  case object Admin extends UiEndpoint { override val value: String = "admin" }
  case object Director extends UiEndpoint { override val value: String = "director" }

  private val byValue = List(Player, Designer, Admin, Director).map(endpoint => endpoint.value -> endpoint).toMap

  def fromString(value: String): Option[UiEndpoint] =
    byValue.get(value)

  implicit val encoder: Encoder[UiEndpoint] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[UiEndpoint] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown UI endpoint: $value"))
}
