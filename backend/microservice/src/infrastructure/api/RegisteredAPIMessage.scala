package microservice.infrastructure.api

import cats.effect.IO
import io.circe.{Decoder, Encoder, Json}
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import org.http4s.Status

import scala.reflect.ClassTag

final case class RegisteredAPIMessage(
  apiName: String,
  requiresUserId: Boolean,
  successStatus: Status,
  runJson: (Json, Option[String], DatabaseSession) => IO[Either[HttpError, Json]]
)

object RegisteredAPIMessage {
  private val DefaultIdentityFields = List("userId")

  def publicApi[Message <: APIMessage[Response], Response](successStatus: Status = Status.Ok)(implicit
    decoder: Decoder[Message],
    encoder: Encoder[Response],
    classTag: ClassTag[Message]
  ): RegisteredAPIMessage =
    buildPublic[Message, Response](successStatus)

  def protectedApi[Message <: APIWithTokenMessage[Response], Response](
    successStatus: Status = Status.Ok,
    identityFields: List[String] = DefaultIdentityFields
  )(implicit
    decoder: Decoder[Message],
    encoder: Encoder[Response],
    classTag: ClassTag[Message]
  ): RegisteredAPIMessage =
    RegisteredAPIMessage(
      apiName = nameOf[Message],
      requiresUserId = true,
      successStatus = successStatus,
      runJson = (payload, headerUserId, databaseSession) =>
        headerUserId match {
          case None =>
            IO.pure(Left(HttpError.unauthorized("Missing x-user-id header")))
          case Some(userId) =>
            decode[Message](withIdentityFields(payload, identityFields, userId)).flatMap {
              case Left(error) =>
                IO.pure(Left(error))
              case Right(message) =>
                message.runAuthenticated(userId, databaseSession).map(_.map(_.asJson))
            }
        }
    )

  private def buildPublic[Message <: APIMessage[Response], Response](successStatus: Status)(implicit
    decoder: Decoder[Message],
    encoder: Encoder[Response],
    classTag: ClassTag[Message]
  ): RegisteredAPIMessage =
    RegisteredAPIMessage(
      apiName = nameOf[Message],
      requiresUserId = false,
      successStatus = successStatus,
      runJson = (payload, _, databaseSession) =>
        decode[Message](payload).flatMap {
          case Left(error) =>
            IO.pure(Left(error))
          case Right(message) =>
            message.run(databaseSession).map(_.map(_.asJson))
        }
    )

  private def decode[Message: Decoder](payload: Json): IO[Either[HttpError, Message]] =
    IO.pure(
      payload.as[Message].left.map(error =>
        HttpError.badRequest("INVALID_REQUEST_BODY", s"Request body does not match API message: ${error.getMessage}")
      )
    )

  private def withIdentityFields(payload: Json, fieldNames: List[String], userId: String): Json =
    payload.asObject match {
      case None =>
        payload
      case Some(jsonObject) =>
        Json.fromJsonObject(
          fieldNames.foldLeft(jsonObject) { (current, fieldName) =>
            if (current.contains(fieldName)) current else current.add(fieldName, Json.fromString(userId))
          }
        )
    }

  private def nameOf[Message](implicit classTag: ClassTag[Message]): String = {
    val objectName = classTag.runtimeClass.getSimpleName.stripSuffix("$")
    val baseName = objectName.stripSuffix("APIMessage")
    s"${baseName}API".toLowerCase
  }
}
