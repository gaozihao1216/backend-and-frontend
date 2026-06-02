package microservice.system.objects

import io.circe.{Decoder, Encoder}

sealed trait LevelStatus {
  def value: String
}

object LevelStatus {
  case object Draft extends LevelStatus { override val value: String = "draft" }
  case object PendingReview extends LevelStatus { override val value: String = "pending_review" }
  case object Published extends LevelStatus { override val value: String = "published" }
  case object Rejected extends LevelStatus { override val value: String = "rejected" }

  private val byValue = List(Draft, PendingReview, Published, Rejected).map(status => status.value -> status).toMap

  def fromString(value: String): Option[LevelStatus] =
    byValue.get(value)

  implicit val encoder: Encoder[LevelStatus] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelStatus] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level status: $value"))
}
