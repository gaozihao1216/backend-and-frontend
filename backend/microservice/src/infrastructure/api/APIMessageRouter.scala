package microservice.infrastructure.api

import cats.effect.IO
import io.circe.Json
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.system.objects.ApiSuccess
import org.http4s.{HttpRoutes, InvalidMessageBodyFailure}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object APIMessageRouter {
  def routes(apiMessages: List[RegisteredAPIMessage], databaseSession: DatabaseSession): HttpRoutes[IO] = {
    val apiMessagesByName = apiMessages.map(message => normalize(message.apiName) -> message).toMap

    HttpRoutes.of[IO] {
      case req @ POST -> Root / "api" / apiName =>
        handleErrors {
          for {
            payload <- req.as[Json]
            response <- apiMessagesByName.get(normalize(apiName)) match {
              case None =>
                HttpError.toResponse(HttpError.notFound("API_NOT_FOUND", s"Unsupported API: $apiName"))
              case Some(apiMessage) =>
                val userId = AuthMiddleware.userIdFromRequest(req)
                for {
                  result <- apiMessage.runJson(payload, userId, databaseSession)
                  response <- HttpError.fromEither(result.map(json => ApiSuccess(json)), apiMessage.successStatus)
                } yield response
            }
          } yield response
        }
    }
  }

  private def normalize(value: String): String =
    value.trim.toLowerCase

  private def handleErrors(action: IO[org.http4s.Response[IO]]): IO[org.http4s.Response[IO]] =
    action.handleErrorWith {
      case error: InvalidMessageBodyFailure =>
        HttpError.toResponse(HttpError.badRequest("INVALID_REQUEST_BODY", error.getMessage))
      case error =>
        HttpError.toResponse(HttpError.badRequest("INVALID_REQUEST", error.getMessage))
    }
}
