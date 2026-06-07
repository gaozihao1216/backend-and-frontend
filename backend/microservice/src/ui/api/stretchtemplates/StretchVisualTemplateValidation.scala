package microservice.ui.api.stretchtemplates

import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{PanelTemplateCategory, PatternTemplateCategory, StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}

private[api] object StretchVisualTemplateValidation {
  def validate(template: StretchVisualTemplate): Either[HttpError, Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidStretchVisualTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else if (!isValidCategory(template)) {
      Left(UiCustomizationErrors.InvalidStretchVisualTemplate(s"Invalid stretch visual template category: ${template.category}").toHttpError)
    } else {
      Right(())
    }

  private def isValidCategory(template: StretchVisualTemplate): Boolean =
    template.kind match {
      case StretchVisualTemplateKind.Panel   => PanelTemplateCategory.isValid(template.category)
      case StretchVisualTemplateKind.Pattern => PatternTemplateCategory.isValid(template.category)
    }

  def sanitize(template: StretchVisualTemplate): StretchVisualTemplate =
    template.copy(
      id = template.id.trim,
      name = template.name.trim,
      sourceDataUrl = template.sourceDataUrl.trim,
      category = StretchVisualTemplate.normalizeCategoryForKind(template.kind, template.category.trim)
    )

  def ensureKind(template: StretchVisualTemplate, expectedKind: StretchVisualTemplateKind): Either[HttpError, StretchVisualTemplate] =
    if (template.kind == expectedKind) {
      Right(template)
    } else {
      Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, template.kind.value).toHttpError)
    }
}
