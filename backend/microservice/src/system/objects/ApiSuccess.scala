package microservice.system.objects

import io.circe.Encoder

/** 成功响应的统一 JSON 包装，与前端 createSuccessResponseSchema 对齐：{ "success": true, "data": T }。 */
final case class ApiSuccess[T](
  data: T,
  success: Boolean = true
)

object ApiSuccess {
  implicit def encoder[T: Encoder]: Encoder[ApiSuccess[T]] =
    Encoder.forProduct2("success", "data")(response => (response.success, response.data))
}
