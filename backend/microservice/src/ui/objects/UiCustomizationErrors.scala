package microservice.ui.objects

import microservice.infrastructure.http.HttpError

sealed trait UiCustomizationApiError {
  def toHttpError: HttpError
}

object UiCustomizationErrors {
  final case class PageNotFound(pageId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("UI_PAGE_NOT_FOUND", s"UI page not found: $pageId")
  }

  final case class PageAlreadyExists(pageId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("UI_PAGE_ALREADY_EXISTS", s"UI page already exists: $pageId")
  }

  final case class ComponentNotFound(componentId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("UI_COMPONENT_NOT_FOUND", s"UI component not found: $componentId")
  }

  final case class ComponentAlreadyExists(componentId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("UI_COMPONENT_ALREADY_EXISTS", s"UI component already exists: $componentId")
  }

  final case class InvalidPageConfig(reason: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("UI_PAGE_CONFIG_INVALID", reason)
  }
}
