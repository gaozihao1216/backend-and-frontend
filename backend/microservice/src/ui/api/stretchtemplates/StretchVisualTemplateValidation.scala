package microservice.ui.api.stretchtemplates

import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}

private[api] object StretchVisualTemplateValidation {
  def validate(template: StretchVisualTemplate): Either[HttpError, Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidStretchVisualTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else {
      Right(())
    }

  def sanitize(template: StretchVisualTemplate): StretchVisualTemplate =
    template.copy(
      id = template.id.trim,
      name = template.name.trim,
      sourceDataUrl = template.sourceDataUrl.trim
    )

  def ensureKind(template: StretchVisualTemplate, expectedKind: StretchVisualTemplateKind): Either[HttpError, StretchVisualTemplate] =
    if (template.kind == expectedKind) {
      Right(template)
    } else {
      Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, template.kind.value).toHttpError)
    }
}
