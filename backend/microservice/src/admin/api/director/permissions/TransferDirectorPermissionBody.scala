package microservice.admin.api.director.permissions

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 总监权限移交请求体：目标必须是 Admin 角色用户。 */
final case class TransferDirectorPermissionBody(
  targetAdminId: String
)

object TransferDirectorPermissionBody {
  implicit val encoder: Encoder[TransferDirectorPermissionBody] = deriveEncoder
  implicit val decoder: Decoder[TransferDirectorPermissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, TransferDirectorPermissionBody] = jsonOf
}
