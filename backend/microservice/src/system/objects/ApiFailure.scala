package microservice.system.objects

import io.circe.Encoder

/** 失败响应的统一 JSON 包装。
  *
  * 定义：success 恒 false +嵌套 [[ErrorBody]] error 字段。
  * 问题：HTTP 4xx/5xx 仍需可解析 JSON 供前端展示 code/message。
  * 作用：HttpError.toApiFailure 构造后由 toResponse 编码为响应体。
  * 关联：前端 ApiFailure Zod schema；与 [[ApiSuccess]] 对称。
  */
final case class ApiFailure(
  success: Boolean = false, // 恒为 false
  error: ErrorBody          // 错误码、消息与可选 details
)

/** ApiFailure 伴生对象：统一失败响应的 Circe 编码（success + error 字段序固定）。 */
object ApiFailure {
  implicit val encoder: Encoder[ApiFailure] =
    Encoder.forProduct2("success", "error")(failure => (failure.success, failure.error))
}
