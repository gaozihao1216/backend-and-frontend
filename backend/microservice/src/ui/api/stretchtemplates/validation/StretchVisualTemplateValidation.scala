package microservice.ui.api.stretchtemplates.validation

import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.category.PanelTemplateCategory
import microservice.ui.objects.category.PatternTemplateCategory
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.objects.UiCustomizationErrors

/** 拉伸视觉模板的字段校验与规范化。 */
private[api] object StretchVisualTemplateValidation {
  def validate(template: StretchVisualTemplate): Step[Unit] =
    PlanStep.fromEither(check(template))

  def ensureKind(template: StretchVisualTemplate, expectedKind: StretchVisualTemplateKind): Step[StretchVisualTemplate] =
    PlanStep.fromEither(checkKind(template, expectedKind))

  def check(template: StretchVisualTemplate): Either[HttpError, Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidStretchVisualTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else if (!isValidCategory(template)) {
      Left(UiCustomizationErrors.InvalidStretchVisualTemplate(s"Invalid stretch visual template category: ${template.category}").toHttpError)
    } else {
      Right(())
    }

  def checkKind(template: StretchVisualTemplate, expectedKind: StretchVisualTemplateKind): Either[HttpError, StretchVisualTemplate] =
    if (template.kind == expectedKind) {
      Right(template)
    } else {
      Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, template.kind.value).toHttpError)
    }

  def sanitize(template: StretchVisualTemplate): StretchVisualTemplate =
    template.copy(
      id = template.id.trim,
      name = template.name.trim,
      sourceDataUrl = template.sourceDataUrl.trim,
      category = StretchVisualTemplate.normalizeCategoryForKind(template.kind, template.category.trim)
    )

  private def isValidCategory(template: StretchVisualTemplate): Boolean =
    template.kind match {
      case StretchVisualTemplateKind.Panel   => PanelTemplateCategory.isValid(template.category)
      case StretchVisualTemplateKind.Pattern => PatternTemplateCategory.isValid(template.category)
    }
}
