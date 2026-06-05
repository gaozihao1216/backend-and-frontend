package microservice.ui.routes

import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.system.objects.ApiSuccess
import microservice.ui.api.{
  CreateButtonTemplateAPIMessage,
  CreateButtonTemplateBody,
  CreatePageComponentAPIMessage,
  CreatePageComponentBody,
  CreateUiPageAPIMessage,
  CreateUiPageBody,
  DeleteButtonTemplateAPIMessage,
  DeletePageComponentAPIMessage,
  DeleteUiPageAPIMessage,
  GetButtonTemplateAPIMessage,
  GetUiPageAPIMessage,
  ListButtonTemplatesAPIMessage,
  ListUiPagesAPIMessage,
  UpdateButtonTemplateAPIMessage,
  UpdateButtonTemplateBody,
  UpdatePageComponentAPIMessage,
  UpdatePageComponentBody,
  UpdateUiPageAPIMessage,
  UpdateUiPageBody
}
import microservice.ui.objects.UiEndpoint
import org.http4s.{HttpRoutes, Status}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object UiCustomizationRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "pages" =>
        withUserId(req) { userId =>
          parseEndpoint(req.uri.query.params.get("endpoint")) match {
            case Left(error) =>
              HttpError.toResponse(error)
            case Right(endpoint) =>
              ListUiPagesAPIMessage(userId, endpoint)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(pages => ApiSuccess(pages))))
          }
        }

      case req @ GET -> Root / "button-templates" =>
        withUserId(req) { userId =>
          ListButtonTemplatesAPIMessage(userId)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(templates => ApiSuccess(templates))))
        }

      case req @ GET -> Root / "button-templates" / templateId =>
        withUserId(req) { userId =>
          GetButtonTemplateAPIMessage(userId, templateId)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
        }

      case req @ POST -> Root / "button-templates" =>
        withUserId(req) { userId =>
          req.as[CreateButtonTemplateBody].flatMap { body =>
            CreateButtonTemplateAPIMessage(userId, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template)), successStatus = Status.Created))
          }
        }

      case req @ PUT -> Root / "button-templates" / templateId =>
        withUserId(req) { userId =>
          req.as[UpdateButtonTemplateBody].flatMap { body =>
            UpdateButtonTemplateAPIMessage(userId, templateId, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
          }
        }

      case req @ DELETE -> Root / "button-templates" / templateId =>
        withUserId(req) { userId =>
          DeleteButtonTemplateAPIMessage(userId, templateId)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
        }

      case req @ GET -> Root / "pages" / pageId =>
        withUserId(req) { userId =>
          GetUiPageAPIMessage(userId, pageId)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
        }

      case req @ POST -> Root / "pages" =>
        withUserId(req) { userId =>
          req.as[CreateUiPageBody].flatMap { body =>
            CreateUiPageAPIMessage(userId, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page)), successStatus = Status.Created))
          }
        }

      case req @ PUT -> Root / "pages" / pageId =>
        withUserId(req) { userId =>
          req.as[UpdateUiPageBody].flatMap { body =>
            UpdateUiPageAPIMessage(userId, pageId, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
          }
        }

      case req @ DELETE -> Root / "pages" / pageId =>
        withUserId(req) { userId =>
          DeleteUiPageAPIMessage(userId, pageId)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
        }

      case req @ POST -> Root / "pages" / pageId / "components" =>
        withUserId(req) { userId =>
          req.as[CreatePageComponentBody].flatMap { body =>
            CreatePageComponentAPIMessage(userId, pageId, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page)), successStatus = Status.Created))
          }
        }

      case req @ PUT -> Root / "pages" / pageId / "components" / componentId =>
        withUserId(req) { userId =>
          req.as[UpdatePageComponentBody].flatMap { body =>
            UpdatePageComponentAPIMessage(userId, pageId, componentId, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
          }
        }

      case req @ DELETE -> Root / "pages" / pageId / "components" / componentId =>
        withUserId(req) { userId =>
          DeletePageComponentAPIMessage(userId, pageId, componentId)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
        }
    }

  private def withUserId(req: org.http4s.Request[IO])(run: String => IO[org.http4s.Response[IO]]): IO[org.http4s.Response[IO]] =
    req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value) match {
      case Some(userId) => run(userId)
      case None => HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
    }

  private def parseEndpoint(value: Option[String]): Either[HttpError, Option[UiEndpoint]] =
    value match {
      case None => Right(None)
      case Some(raw) =>
        UiEndpoint.fromString(raw).map(endpoint => Right(Some(endpoint))).getOrElse(
          Left(HttpError.badRequest("INVALID_UI_ENDPOINT", s"Unknown UI endpoint: $raw"))
        )
    }
}
