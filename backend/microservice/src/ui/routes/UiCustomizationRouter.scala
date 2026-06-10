package microservice.ui.routes

import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.system.objects.ApiSuccess
import microservice.ui.api.buttontemplates.{
  CreateButtonTemplateAPIMessage,
  CreateButtonTemplateBody,
  DeleteButtonTemplateAPIMessage,
  GetButtonTemplateAPIMessage,
  ListButtonTemplatesAPIMessage,
  UpdateButtonTemplateAPIMessage,
  UpdateButtonTemplateBody
}
import microservice.ui.api.stretchtemplates.{
  CreateStretchVisualTemplateAPIMessage,
  CreateStretchVisualTemplateBody,
  DeleteStretchVisualTemplateAPIMessage,
  ListStretchVisualTemplatesAPIMessage,
  UpdateStretchVisualTemplateAPIMessage,
  UpdateStretchVisualTemplateBody
}
import microservice.ui.api.pagecomponents.{
  CreatePageComponentAPIMessage,
  CreatePageComponentBody,
  DeletePageComponentAPIMessage,
  UpdatePageComponentAPIMessage,
  UpdatePageComponentBody
}
import microservice.ui.api.pages.{
  CreateUiPageAPIMessage,
  CreateUiPageBody,
  DeleteUiPageAPIMessage,
  GetUiPageAPIMessage,
  ListUiPagesAPIMessage,
  UpdateUiPageAPIMessage,
  UpdateUiPageBody
}
import microservice.ui.api.panelworkflows.RegisterCheckInPanelRewardsBody
import microservice.ui.objects.{StretchVisualTemplateKind, UiEndpoint}
import microservice.player.runtime.{CheckInSlotReward, PlayerWeeklyCheckInService}
import org.http4s.{HttpRoutes, Status}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 总监 UI 定制 HTTP 入口，前缀 /admin/director/ui。
  *
  * 实现：PageConfig、按钮模板、拉伸视觉、页面组件的 CRUD；多数 APIMessage 内 requireAdminLevel(Director)。
  * 关联：frontend DirectorWorkbenchPage、DynamicPageRenderer 消费配置；部分 workflow 联动 player 签到奖励。
  */
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

      case req @ GET -> Root / "panel-templates" =>
        withUserId(req) { userId =>
          ListStretchVisualTemplatesAPIMessage(userId, StretchVisualTemplateKind.Panel)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(templates => ApiSuccess(templates))))
        }

      case req @ POST -> Root / "panel-templates" =>
        withUserId(req) { userId =>
          req.as[CreateStretchVisualTemplateBody].flatMap { body =>
            CreateStretchVisualTemplateAPIMessage(userId, StretchVisualTemplateKind.Panel, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template)), successStatus = Status.Created))
          }
        }

      case req @ PUT -> Root / "panel-templates" / templateId =>
        withUserId(req) { userId =>
          req.as[UpdateStretchVisualTemplateBody].flatMap { body =>
            UpdateStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Panel, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
          }
        }

      case req @ DELETE -> Root / "panel-templates" / templateId =>
        withUserId(req) { userId =>
          DeleteStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Panel)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
        }

      case req @ GET -> Root / "pattern-templates" =>
        withUserId(req) { userId =>
          ListStretchVisualTemplatesAPIMessage(userId, StretchVisualTemplateKind.Pattern)
            .run(databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(templates => ApiSuccess(templates))))
        }

      case req @ POST -> Root / "pattern-templates" =>
        withUserId(req) { userId =>
          req.as[CreateStretchVisualTemplateBody].flatMap { body =>
            CreateStretchVisualTemplateAPIMessage(userId, StretchVisualTemplateKind.Pattern, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template)), successStatus = Status.Created))
          }
        }

      case req @ PUT -> Root / "pattern-templates" / templateId =>
        withUserId(req) { userId =>
          req.as[UpdateStretchVisualTemplateBody].flatMap { body =>
            UpdateStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Pattern, body)
              .run(databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
          }
        }

      case req @ DELETE -> Root / "pattern-templates" / templateId =>
        withUserId(req) { userId =>
          DeleteStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Pattern)
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

      case req @ PUT -> Root / "panel-workflows" / panelId / "check-in-rewards" =>
        withUserId(req) { _ =>
          req.as[RegisterCheckInPanelRewardsBody].flatMap { body =>
            databaseSession.withTransaction { connection =>
              IO.blocking {
                PlayerWeeklyCheckInService.registerPanelRewards(
                  connection,
                  panelId,
                  body.slots.map(slot => CheckInSlotReward(slot.coins, slot.gems, slot.fragments))
                )
              }.flatMap { _ =>
                Ok(ApiSuccess(io.circe.Json.obj("panelId" -> io.circe.Json.fromString(panelId))))
              }
            }
          }
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
