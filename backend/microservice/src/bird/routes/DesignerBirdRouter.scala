package microservice.bird.routes

import cats.effect.IO
import microservice.bird.api.{
  CreateBirdDesignAPIMessage,
  CreateBirdDesignBody,
  DeleteBirdDesignAPIMessage,
  ListBirdDesignsAPIMessage,
  SubmitBirdDesignAPIMessage,
  UpdateBirdDesignAPIMessage,
  UpdateBirdDesignBody
}
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{ApiSuccess, LevelStatus}
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object DesignerBirdRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "bird-designs" :? StatusQueryParamMatcher(statusValue) =>
        currentUserId(req) match {
          case Some(designerId) =>
            val status = statusValue.flatMap(LevelStatus.fromString)
            ListBirdDesignsAPIMessage(designerId, status)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(designs => ApiSuccess(designs))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "bird-designs" =>
        currentUserId(req) match {
          case Some(designerId) =>
            req.as[CreateBirdDesignBody].flatMap { body =>
              CreateBirdDesignAPIMessage(designerId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ PUT -> Root / "bird-designs" / designId =>
        currentUserId(req) match {
          case Some(designerId) =>
            req.as[UpdateBirdDesignBody].flatMap { body =>
              UpdateBirdDesignAPIMessage(designerId, designId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ DELETE -> Root / "bird-designs" / designId =>
        currentUserId(req) match {
          case Some(designerId) =>
            DeleteBirdDesignAPIMessage(designerId, designId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "bird-designs" / designId / "submit" =>
        currentUserId(req) match {
          case Some(designerId) =>
            SubmitBirdDesignAPIMessage(designerId, designId)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission)), successStatus = Status.Created))
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }

  private object StatusQueryParamMatcher extends OptionalQueryParamDecoderMatcher[String]("status")

  private def currentUserId(req: org.http4s.Request[IO]): Option[String] =
    req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
}
