package microservice.system.objects

import io.circe.{Decoder, Encoder}

sealed trait SubmissionStatus {
  def value: String
}

object SubmissionStatus {
  case object PendingReview extends SubmissionStatus { override val value: String = "pending_review" }
  case object Approved extends SubmissionStatus { override val value: String = "approved" }
  case object Rejected extends SubmissionStatus { override val value: String = "rejected" }

  private val byValue = List(PendingReview, Approved, Rejected).map(status => status.value -> status).toMap

  def fromString(value: String): Option[SubmissionStatus] =
    byValue.get(value)

  implicit val encoder: Encoder[SubmissionStatus] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[SubmissionStatus] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown submission status: $value"))
}
