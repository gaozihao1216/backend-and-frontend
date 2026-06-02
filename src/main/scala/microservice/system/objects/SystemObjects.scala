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

  implicit val encoder: Encoder[UserRole] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[UserRole] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown user role: $value"))
}

sealed trait LevelStatus {
  def value: String
}

object LevelStatus {
  case object Draft extends LevelStatus { override val value: String = "draft" }
  case object PendingReview extends LevelStatus { override val value: String = "pending_review" }
  case object Published extends LevelStatus { override val value: String = "published" }
  case object Rejected extends LevelStatus { override val value: String = "rejected" }

  private val byValue = List(Draft, PendingReview, Published, Rejected).map(status => status.value -> status).toMap

  implicit val encoder: Encoder[LevelStatus] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelStatus] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level status: $value"))
}

sealed trait SubmissionStatus {
  def value: String
}

object SubmissionStatus {
  case object PendingReview extends SubmissionStatus { override val value: String = "pending_review" }
  case object Approved extends SubmissionStatus { override val value: String = "approved" }
  case object Rejected extends SubmissionStatus { override val value: String = "rejected" }

  private val byValue = List(PendingReview, Approved, Rejected).map(status => status.value -> status).toMap

  implicit val encoder: Encoder[SubmissionStatus] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[SubmissionStatus] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown submission status: $value"))
}

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

  implicit val encoder: Encoder[LevelTag] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelTag] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level tag: $value"))
}

final case class ErrorBody(
  code: String,
  message: String,
  details: Option[String]
)

object ErrorBody {
  implicit val encoder: Encoder[ErrorBody] =
    Encoder.forProduct3("code", "message", "details")(error => (error.code, error.message, error.details))
}

final case class ApiFailure(
  success: Boolean = false,
  error: ErrorBody
)

object ApiFailure {
  implicit val encoder: Encoder[ApiFailure] =
    Encoder.forProduct2("success", "error")(failure => (failure.success, failure.error))
}

final case class ApiSuccess[T](
  data: T,
  success: Boolean = true
)

object ApiSuccess {
  implicit def encoder[T: Encoder]: Encoder[ApiSuccess[T]] =
    Encoder.forProduct2("success", "data")(response => (response.success, response.data))
}
