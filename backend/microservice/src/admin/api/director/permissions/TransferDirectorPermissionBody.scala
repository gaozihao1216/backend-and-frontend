package microservice.admin.api.director.permissions

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 总监权限移交请求体。
  *
  * @param targetAdminId 接收总监权限的管理员用户 ID；须存在且 role 为 Admin
  */
final case class TransferDirectorPermissionBody(
  targetAdminId: String
)

/** TransferDirectorPermissionBody 的 Circe/http4s 编解码 companion。 */
object TransferDirectorPermissionBody {
  implicit val encoder: Encoder[TransferDirectorPermissionBody] = deriveEncoder
  implicit val decoder: Decoder[TransferDirectorPermissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, TransferDirectorPermissionBody] = jsonOf
}
