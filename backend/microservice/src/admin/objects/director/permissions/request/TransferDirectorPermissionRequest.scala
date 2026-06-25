package microservice.admin.objects.director.permissions.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 总监权限移交请求对象。
  *
  * @param targetAdminId 接收总监权限的管理员用户 ID；须存在且 role 为 Admin
  */
final case class TransferDirectorPermissionRequest(
  targetAdminId: String
)

/** TransferDirectorPermissionRequest 的 Circe/http4s 编解码 companion。 */
private[admin] object TransferDirectorPermissionRequest {
  implicit val encoder: Encoder[TransferDirectorPermissionRequest] = deriveEncoder
  implicit val decoder: Decoder[TransferDirectorPermissionRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, TransferDirectorPermissionRequest] = jsonOf
}
