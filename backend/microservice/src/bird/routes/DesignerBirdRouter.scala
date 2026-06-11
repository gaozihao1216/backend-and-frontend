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
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.system.objects.{ApiSuccess, LevelStatus}
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 设计师鸟类设计 HTTP 入口，挂载在 /designer 前缀下。 */
object DesignerBirdRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "bird-designs" :? StatusQueryParamMatcher(statusValue) =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        val status = statusValue.flatMap(LevelStatus.fromString)
        ListBirdDesignsAPIMessage(designerId, status)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(designs => ApiSuccess(designs))))

      case req @ POST -> Root / "bird-designs" =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateBirdDesignBody].flatMap { body =>
          CreateBirdDesignAPIMessage(designerId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design)), successStatus = Status.Created))
        }

      case req @ PUT -> Root / "bird-designs" / designId =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateBirdDesignBody].flatMap { body =>
          UpdateBirdDesignAPIMessage(designerId, designId, body)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))
        }

      case req @ DELETE -> Root / "bird-designs" / designId =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        DeleteBirdDesignAPIMessage(designerId, designId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(design => ApiSuccess(design))))

      case req @ POST -> Root / "bird-designs" / designId / "submit" =>
        val designerId = AuthMiddleware.userIdFromRequest(req).get
        SubmitBirdDesignAPIMessage(designerId, designId)
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission)), successStatus = Status.Created))
    }

  private object StatusQueryParamMatcher extends OptionalQueryParamDecoderMatcher[String]("status")
}
