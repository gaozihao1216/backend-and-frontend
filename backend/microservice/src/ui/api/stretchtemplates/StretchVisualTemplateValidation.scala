package microservice.ui.api.stretchtemplates

import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{PanelTemplateCategory, PatternTemplateCategory, StretchVisualTemplate, StretchVisualTemplateKind, UiCustomizationErrors}

/** 拉伸视觉模板的字段校验与规范化。
  *
  * 定义：Create/Update StretchVisualTemplate APIMessage 写入前的共享校验层。
  * 作用：sanitize 去空白并按 kind 规范化 category；ensureKind 校验路由一致。
  * 关联：PanelTemplateCategory / PatternTemplateCategory。
  */
private[api] object StretchVisualTemplateValidation {
  /** 校验 id/name/sourceDataUrl 与 kind 对应的 category 合法性。 */
  def validate(template: StretchVisualTemplate): Either[HttpError, Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidStretchVisualTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else if (!isValidCategory(template)) {
      Left(UiCustomizationErrors.InvalidStretchVisualTemplate(s"Invalid stretch visual template category: ${template.category}").toHttpError)
    } else {
      Right(())
    }

  /** 按 kind 检查 category 是否在合法枚举内。 */
  private def isValidCategory(template: StretchVisualTemplate): Boolean =
    template.kind match {
      case StretchVisualTemplateKind.Panel   => PanelTemplateCategory.isValid(template.category)
      case StretchVisualTemplateKind.Pattern => PatternTemplateCategory.isValid(template.category)
    }

  /** 去除字符串字段首尾空白并按 kind 规范化 category。 */
  def sanitize(template: StretchVisualTemplate): StretchVisualTemplate =
    template.copy(
      id = template.id.trim,
      name = template.name.trim,
      sourceDataUrl = template.sourceDataUrl.trim,
      category = StretchVisualTemplate.normalizeCategoryForKind(template.kind, template.category.trim)
    )

  /** 确保模板 kind 与路由期望的 expectedKind 一致。 */
  def ensureKind(template: StretchVisualTemplate, expectedKind: StretchVisualTemplateKind): Either[HttpError, StretchVisualTemplate] =
    if (template.kind == expectedKind) {
      Right(template)
    } else {
      Left(UiCustomizationErrors.StretchVisualTemplateKindMismatch(expectedKind.value, template.kind.value).toHttpError)
    }
}
