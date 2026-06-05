package microservice.ui.api

import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{ButtonTemplate, UiCustomizationErrors}

private[api] object ButtonTemplateValidation {
  def validate(template: ButtonTemplate): Either[HttpError, Unit] =
    if (template.id.trim.isEmpty || template.name.trim.isEmpty || template.sourceDataUrl.trim.isEmpty) {
      Left(UiCustomizationErrors.InvalidButtonTemplate("id, name and sourceDataUrl are required").toHttpError)
    } else if (!isValidSlice(template)) {
      Left(UiCustomizationErrors.InvalidButtonTemplate("slice values must be finite and non-negative").toHttpError)
    } else {
      Right(())
    }

  def sanitize(template: ButtonTemplate): ButtonTemplate =
    template.copy(
      id = template.id.trim,
      name = template.name.trim,
      sourceDataUrl = template.sourceDataUrl.trim
    )

  private def isValidSlice(template: ButtonTemplate): Boolean = {
    val values = List(template.slice.top, template.slice.right, template.slice.bottom, template.slice.left)
    values.forall(value => !value.isNaN && !value.isInfinity && value >= 0)
  }
}
