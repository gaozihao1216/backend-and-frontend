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
import microservice.ui.api.panelworkflows.{RegisterCheckInPanelRewardsAPIMessage, RegisterCheckInPanelRewardsBody}
import microservice.ui.objects.{StretchVisualTemplateKind, UiEndpoint}
import microservice.player.runtime.CheckInSlotReward
import microservice.infrastructure.http.AuthMiddleware
import org.http4s.{HttpRoutes, Status}
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 总监 UI 定制 HTTP 入口，前缀 /admin/director/ui。
  *
  * 实现：PageConfig、按钮模板、拉伸视觉、页面组件的 CRUD；多数 APIMessage 内 requireAdminLevel(Director)。
  * 关联：frontend DirectorWorkbenchPage、DynamicPageRenderer 消费配置；部分 workflow 联动 player 签到奖励。
  */
object UiCustomizationRouter {
  /** 注册 /admin/director/ui 下的全部路由。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /pages?endpoint= — 列出页面配置（可选按角色端点过滤）
      case req @ GET -> Root / "pages" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        parseEndpoint(req.uri.query.params.get("endpoint")) match {
          case Left(error) =>
            HttpError.toResponse(error)
          case Right(endpoint) =>
            ListUiPagesAPIMessage(userId, endpoint)
              .runAuthenticated(userId, databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(pages => ApiSuccess(pages))))
          }

      // --- 按钮模板 CRUD ---
      case req @ GET -> Root / "button-templates" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        ListButtonTemplatesAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(templates => ApiSuccess(templates))))

      case req @ GET -> Root / "button-templates" / templateId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetButtonTemplateAPIMessage(userId, templateId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))

      case req @ POST -> Root / "button-templates" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateButtonTemplateBody].flatMap { body =>
          CreateButtonTemplateAPIMessage(userId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template)), successStatus = Status.Created))
          }

      case req @ PUT -> Root / "button-templates" / templateId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateButtonTemplateBody].flatMap { body =>
          UpdateButtonTemplateAPIMessage(userId, templateId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
          }

      case req @ DELETE -> Root / "button-templates" / templateId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        DeleteButtonTemplateAPIMessage(userId, templateId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))

      // --- 面板拉伸模板 CRUD（kind = Panel）---
      case req @ GET -> Root / "panel-templates" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        ListStretchVisualTemplatesAPIMessage(userId, StretchVisualTemplateKind.Panel)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(templates => ApiSuccess(templates))))

      case req @ POST -> Root / "panel-templates" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateStretchVisualTemplateBody].flatMap { body =>
          CreateStretchVisualTemplateAPIMessage(userId, StretchVisualTemplateKind.Panel, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template)), successStatus = Status.Created))
          }

      case req @ PUT -> Root / "panel-templates" / templateId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateStretchVisualTemplateBody].flatMap { body =>
          UpdateStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Panel, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
          }

      case req @ DELETE -> Root / "panel-templates" / templateId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        DeleteStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Panel)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))

      // --- 图案拉伸模板 CRUD（kind = Pattern）---
      case req @ GET -> Root / "pattern-templates" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        ListStretchVisualTemplatesAPIMessage(userId, StretchVisualTemplateKind.Pattern)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(templates => ApiSuccess(templates))))

      case req @ POST -> Root / "pattern-templates" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateStretchVisualTemplateBody].flatMap { body =>
          CreateStretchVisualTemplateAPIMessage(userId, StretchVisualTemplateKind.Pattern, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template)), successStatus = Status.Created))
          }

      case req @ PUT -> Root / "pattern-templates" / templateId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateStretchVisualTemplateBody].flatMap { body =>
          UpdateStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Pattern, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))
          }

      case req @ DELETE -> Root / "pattern-templates" / templateId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        DeleteStretchVisualTemplateAPIMessage(userId, templateId, StretchVisualTemplateKind.Pattern)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(template => ApiSuccess(template))))

      // --- 单页 CRUD 与组件管理 ---
      case req @ GET -> Root / "pages" / pageId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        GetUiPageAPIMessage(userId, pageId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))

      case req @ POST -> Root / "pages" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreateUiPageBody].flatMap { body =>
          CreateUiPageAPIMessage(userId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page)), successStatus = Status.Created))
          }

      case req @ PUT -> Root / "pages" / pageId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdateUiPageBody].flatMap { body =>
          UpdateUiPageAPIMessage(userId, pageId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
          }

      case req @ DELETE -> Root / "pages" / pageId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        DeleteUiPageAPIMessage(userId, pageId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))

      case req @ POST -> Root / "pages" / pageId / "components" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[CreatePageComponentBody].flatMap { body =>
          CreatePageComponentAPIMessage(userId, pageId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page)), successStatus = Status.Created))
          }

      case req @ PUT -> Root / "pages" / pageId / "components" / componentId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[UpdatePageComponentBody].flatMap { body =>
          UpdatePageComponentAPIMessage(userId, pageId, componentId, body)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))
          }

      case req @ DELETE -> Root / "pages" / pageId / "components" / componentId =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        DeletePageComponentAPIMessage(userId, pageId, componentId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(page => ApiSuccess(page))))

      // PUT /panel-workflows/:panelId/check-in-rewards — 注册签到面板 7 格奖励（联动 player 运行时）
      case req @ PUT -> Root / "panel-workflows" / panelId / "check-in-rewards" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[RegisterCheckInPanelRewardsBody].flatMap { body =>
        RegisterCheckInPanelRewardsAPIMessage(
          userId,
          panelId,
          body.slots.map(slot => CheckInSlotReward(slot.coins, slot.gems, slot.fragments))
        )
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
        }
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
