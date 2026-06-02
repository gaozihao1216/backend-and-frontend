package microservice.system.objects

import io.circe.{Decoder, Encoder}

sealed trait LevelTag {
  def value: String
}

object LevelTag {
  case object Puzzle extends LevelTag { override val value: String = "puzzle" }
  case object Hard extends LevelTag { override val value: String = "hard" }
  case object Beginner extends LevelTag { override val value: String = "beginner" }
  case object Funny extends LevelTag { override val value: String = "funny" }
  case object Strategy extends LevelTag { override val value: String = "strategy" }

  private val byValue = List(Puzzle, Hard, Beginner, Funny, Strategy).map(tag => tag.value -> tag).toMap

  def fromString(value: String): Option[LevelTag] =
    byValue.get(value)

  implicit val encoder: Encoder[LevelTag] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelTag] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level tag: $value"))
}
