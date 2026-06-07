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

  final case class ButtonTemplateNotFound(templateId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("UI_BUTTON_TEMPLATE_NOT_FOUND", s"UI button template not found: $templateId")
  }

  final case class ButtonTemplateAlreadyExists(templateId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("UI_BUTTON_TEMPLATE_ALREADY_EXISTS", s"UI button template already exists: $templateId")
  }

  final case class InvalidPageConfig(reason: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("UI_PAGE_CONFIG_INVALID", reason)
  }

  final case class InvalidButtonTemplate(reason: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("UI_BUTTON_TEMPLATE_INVALID", reason)
  }

  final case class StretchVisualTemplateNotFound(templateId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("UI_STRETCH_TEMPLATE_NOT_FOUND", s"UI stretch visual template not found: $templateId")
  }

  final case class StretchVisualTemplateAlreadyExists(templateId: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("UI_STRETCH_TEMPLATE_ALREADY_EXISTS", s"UI stretch visual template already exists: $templateId")
  }

  final case class InvalidStretchVisualTemplate(reason: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("UI_STRETCH_TEMPLATE_INVALID", reason)
  }

  final case class StretchVisualTemplateKindMismatch(expected: String, actual: String) extends UiCustomizationApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("UI_STRETCH_TEMPLATE_KIND_MISMATCH", s"Expected template kind $expected but got $actual")
  }
}
