package microservice.ui.validation.stretchtemplates

import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.category.PanelTemplateCategory
import microservice.ui.objects.category.PatternTemplateCategory
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.objects.errors.UiCustomizationErrors

/** 拉伸视觉模板的字段校验与规范化。 */
private[ui] object StretchVisualTemplateValidation {
  def validate(template: StretchVisualTemplate): Step[Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      PlanStep.fail(UiCustomizationErrors.InvalidStretchVisualTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else if (!isValidCategory(template)) {
      PlanStep.fail(UiCustomizationErrors.InvalidStretchVisualTemplate(s"Invalid stretch visual template category: ${template.category}").toHttpError)
    } else {
      PlanStep.succeed(())
    }

  def ensureKind(template: StretchVisualTemplate, expectedKind: StretchVisualTemplateKind): Step[StretchVisualTemplate] =
    if (template.kind == expectedKind) {
      PlanStep.succeed(template)
    } else {
      PlanStep.fail(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, template.kind.value).toHttpError)
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
