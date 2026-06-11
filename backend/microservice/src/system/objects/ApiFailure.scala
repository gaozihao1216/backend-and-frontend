package microservice.system.objects

import io.circe.Encoder

/** 失败响应的统一 JSON 包装，与前端 ApiFailure Zod schema 对齐。
  *
  * 序列化形状：{ "success": false, "error": ErrorBody }。
  * 关联：[[microservice.infrastructure.http.HttpError.toApiFailure]] 构造此类型后由 toResponse 编码。
  */
final case class ApiFailure(
  success: Boolean = false, // 恒为 false
  error: ErrorBody          // 错误码、消息与可选 details
)

object ApiFailure {
  implicit val encoder: Encoder[ApiFailure] =
    Encoder.forProduct2("success", "error")(failure => (failure.success, failure.error))
}
