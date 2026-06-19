package microservice.ui.api.buttontemplates

import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{ButtonTemplate, ButtonTemplateCategory, UiCustomizationErrors}

/** 按钮模板的字段校验与 trim 规范化。
  *
  * 定义：Create/Update ButtonTemplate APIMessage 写入前的共享校验层。
  * 作用：sanitize 去空白；validate 检查必填字段、category 与 slice 数值。
  * 关联：ButtonTemplateCategory；UiCustomizationErrors.InvalidButtonTemplate。
  */
private[api] object ButtonTemplateValidation {
  /** 校验 id/name/sourceDataUrl、category 与九宫格 slice 数值合法性。 */
  def validate(template: ButtonTemplate): Either[HttpError, Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidButtonTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else if (!ButtonTemplateCategory.isValid(template.category)) {
      Left(UiCustomizationErrors.InvalidButtonTemplate(s"Invalid button template category: ${template.category}").toHttpError)
    } else if (!isValidSlice(template)) {
      Left(UiCustomizationErrors.InvalidButtonTemplate("slice values must be finite and non-negative").toHttpError)
    } else {
      Right(())
    }

  /** 去除字符串字段首尾空白。 */
  def sanitize(template: ButtonTemplate): ButtonTemplate =
    template.copy(
      id = template.id.trim,
      name = template.name.trim,
      sourceDataUrl = template.sourceDataUrl.trim,
      category = template.category.trim
    )

  /** 检查九宫格 slice 四边值均为有限非负数。 */
  /** 检查九宫格 slice 四边值均为有限非负数。 */
  private def isValidSlice(template: ButtonTemplate): Boolean = {
    val values = List(template.slice.top, template.slice.right, template.slice.bottom, template.slice.left)
    values.forall(value => !value.isNaN && !value.isInfinity && value >= 0)
  }
}
