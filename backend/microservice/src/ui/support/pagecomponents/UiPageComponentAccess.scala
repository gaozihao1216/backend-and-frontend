package microservice.ui.support.pagecomponents

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.component.PageComponent
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** 页面组件 CRUD 的查存在与写结果校验。 */
private[ui] object UiPageComponentAccess {
  def requirePageForNewComponent(connection: Connection, pageId: String, componentId: String): Step[Unit] =
    EitherT.liftF(IO(UiPageTable.findById(connection, pageId))).flatMap {
      case None =>
        EitherT.leftT(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(page) if page.components.exists(_.id == componentId) =>
        EitherT.leftT(UiCustomizationErrors.ComponentAlreadyExists(componentId).toHttpError)
      case Some(_) =>
        EitherT.rightT(())
    }

  def requireAddComponent(connection: Connection, pageId: String, component: PageComponent): Step[PageConfig] =
    EitherT.liftF(IO(UiPageTable.addComponent(connection, pageId, component, Instant.now().toString))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.ComponentAlreadyExists(component.id).toHttpError)
      case Some(row) => EitherT.rightT(UiPageRowMapper.toPageConfig(row))
    }

  def requirePageWithComponent(connection: Connection, pageId: String, componentId: String): Step[Unit] =
    EitherT.liftF(IO(UiPageTable.findById(connection, pageId))).flatMap {
      case None =>
        EitherT.leftT(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(page) if !page.components.exists(_.id == componentId) =>
        EitherT.leftT(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
      case Some(_) =>
        EitherT.rightT(())
    }

  def requireUpdateComponent(
    connection: Connection,
    pageId: String,
    componentId: String,
    component: PageComponent
  ): Step[PageConfig] = {
    val normalized = component match {
      case button: microservice.ui.objects.component.ButtonComponent => button.copy(id = componentId)
      case panel: microservice.ui.objects.component.PanelComponent   => panel.copy(id = componentId)
      case text: microservice.ui.objects.component.TextComponent     => text.copy(id = componentId)
      case list: microservice.ui.objects.component.ListComponent     => list.copy(id = componentId)
    }
    EitherT.liftF(IO(UiPageTable.updateComponent(connection, pageId, componentId, normalized, Instant.now().toString))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
      case Some(row) => EitherT.rightT(UiPageRowMapper.toPageConfig(row))
    }
  }

  def requireDeleteComponent(connection: Connection, pageId: String, componentId: String): Step[PageConfig] =
    EitherT.liftF(IO(UiPageTable.deleteComponent(connection, pageId, componentId, Instant.now().toString))).flatMap {
      case None      => EitherT.leftT(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
      case Some(row) => EitherT.rightT(UiPageRowMapper.toPageConfig(row))
    }
}
