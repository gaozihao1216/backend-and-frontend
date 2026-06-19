package microservice.system.objects

import io.circe.Encoder

/** API 错误体，嵌套在 ApiFailure.error 中。
  *
  * 定义：code + message + 可选 details 三元组。
  * 问题：纯 HTTP 状态码不足以区分业务错误（如校验 vs 权限）。
  * 作用：前端按 code 分支处理，message 直接展示给用户。
  * 关联：[[HttpError]] 各工厂方法；`frontend/src/objects/system/error-body.ts` 字段对齐。
  */
final case class ErrorBody(
  code: String,                // 机器可读错误码，如 FORBIDDEN、BIND_VALIDATION
  message: String,             // 人类可读说明
  details: Option[String]      // 可选补充（校验字段列表、内部提示等）
)

object ErrorBody {
  implicit val encoder: Encoder[ErrorBody] =
    Encoder.forProduct3("code", "message", "details")(error => (error.code, error.message, error.details))
}
