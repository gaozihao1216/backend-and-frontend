package microservice.system.objects

import io.circe.Encoder

/** API 错误体，嵌套在 ApiFailure.error 中。
  *
  * 与前端 `frontend/src/objects/system/error-body.ts` 字段一一对应。
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
