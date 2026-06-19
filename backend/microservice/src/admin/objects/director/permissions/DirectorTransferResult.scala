package microservice.admin.objects.director.permissions

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 总监权限移交成功结果：记录前任与新任总监的用户 ID。
  *
  * 关联：TransferDirectorPermissionAPIMessage 成功响应；前端可用于刷新会话或提示。
  */
final case class DirectorTransferResult(
  previousDirectorId: String,
  newDirectorId: String
)

object DirectorTransferResult {
  implicit val encoder: Encoder[DirectorTransferResult] = deriveEncoder
  implicit val decoder: Decoder[DirectorTransferResult] = deriveDecoder
}
