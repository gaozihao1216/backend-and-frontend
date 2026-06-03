package microservice.system.objects

import io.circe.{Decoder, Encoder}

sealed trait AdminLevel {
  def value: String
}

object AdminLevel {
  case object Standard extends AdminLevel { override val value: String = "standard" }
  case object Director extends AdminLevel { override val value: String = "director" }

  private val byValue = List(Standard, Director).map(level => level.value -> level).toMap

  def fromString(value: String): Option[AdminLevel] =
    byValue.get(value)

  implicit val encoder: Encoder[AdminLevel] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[AdminLevel] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown admin level: $value"))
}
