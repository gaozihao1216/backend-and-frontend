package microservice.core

import cats.effect.IO
import microservice.system.objects.{ApiFailure, ErrorBody}
import io.circe.Encoder
import org.http4s.Response
import org.http4s.Status
import org.http4s.circe.CirceEntityEncoder._

final case class HttpError(
  status: Status,
  code: String,
  message: String,
  details: Option[String] = None
) {
  def toApiFailure: ApiFailure =
    ApiFailure(error = ErrorBody(code = code, message = message, details = details))
}

object HttpError {
  def badRequest(code: String, message: String, details: Option[String] = None): HttpError =
    HttpError(Status.BadRequest, code, message, details)

  def forbidden(message: String): HttpError =
    HttpError(Status.Forbidden, "FORBIDDEN", message)

  def notFound(code: String, message: String): HttpError =
    HttpError(Status.NotFound, code, message)

  def conflict(code: String, message: String): HttpError =
    HttpError(Status.Conflict, code, message)

  def unauthorized(message: String): HttpError =
    HttpError(Status.Unauthorized, "UNAUTHORIZED", message)

  def toResponse(error: HttpError): IO[Response[IO]] =
    IO.pure(Response[IO](status = error.status).withEntity(error.toApiFailure))

  def fromEither[A: Encoder](result: Either[HttpError, A], successStatus: Status = Status.Ok): IO[Response[IO]] =
    result match {
      case Right(value) => IO.pure(Response[IO](status = successStatus).withEntity(value))
      case Left(error)  => toResponse(error)
    }
}
