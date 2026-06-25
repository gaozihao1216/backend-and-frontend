package microservice.ui.validation.buttontemplates

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.objects.category.ButtonTemplateCategory
import microservice.ui.objects.errors.UiCustomizationErrors

/** 按钮模板的字段校验与 trim 规范化。 */
private[ui] object ButtonTemplateValidation {
  /** 校验模板必填字段、category 与 slice 数值合法性。 */
  def validate(template: ButtonTemplate): IO[Either[HttpError, Unit]] =
    IO.pure(check(template))

  private def check(template: ButtonTemplate): Either[HttpError, Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidButtonTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else if (!ButtonTemplateCategory.isValid(template.category)) {
      Left(UiCustomizationErrors.InvalidButtonTemplate(s"Invalid button template category: ${template.category}").toHttpError)
    } else if (!isValidSlice(template)) {
      Left(UiCustomizationErrors.InvalidButtonTemplate("slice values must be finite and non-negative").toHttpError)
    } else {
      Right(())
    }

  /** 对 id/name/sourceDataUrl/category 做 trim 规范化（不含业务校验）。 */
  def sanitize(template: ButtonTemplate): ButtonTemplate =
    template.copy(
      id = template.id.trim,
      name = template.name.trim,
      sourceDataUrl = template.sourceDataUrl.trim,
      category = template.category.trim
    )

  /** 校验九宫格 slice 四边均为有限非负数。 */
  private def isValidSlice(template: ButtonTemplate): Boolean = {
    val values = List(template.slice.top, template.slice.right, template.slice.bottom, template.slice.left)
    values.forall(value => !value.isNaN && !value.isInfinity && value >= 0)
  }
}
