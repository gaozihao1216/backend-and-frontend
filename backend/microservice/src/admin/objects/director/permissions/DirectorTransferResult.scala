package microservice.admin.objects.director.permissions

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 总监权限移交成功结果 DTO。
  *
  * 领域含义：记录前任与新任总监的用户 ID，便于前端刷新会话或展示移交确认。
  * 字段：previousDirectorId 移交前 Director；newDirectorId 移交后 Director。
  * 使用者：TransferDirectorPermissionAPIMessage 成功响应。
  */
final case class DirectorTransferResult(
  previousDirectorId: String,
  newDirectorId: String
)

/** DirectorTransferResult 的 Circe 编解码 companion。 */
private[admin] object DirectorTransferResult {
  implicit val encoder: Encoder[DirectorTransferResult] = deriveEncoder
  implicit val decoder: Decoder[DirectorTransferResult] = deriveDecoder
}
