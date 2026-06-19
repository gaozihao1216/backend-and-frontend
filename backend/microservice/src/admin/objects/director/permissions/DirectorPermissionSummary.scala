package microservice.admin.objects.director.permissions

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.AdminLevel

/** 总监权限摘要 DTO：返回当前用户的 adminLevel 及 UI 定制能力标志。
  *
  * 关联：GetDirectorPermissionsAPIMessage；前端 Director 面板据此展示可用功能。
  */
final case class DirectorPermissionSummary(
  userId: String,
  adminLevel: AdminLevel,
  canManageUiCustomization: Boolean
)

object DirectorPermissionSummary {
  implicit val encoder: Encoder[DirectorPermissionSummary] = deriveEncoder
  implicit val decoder: Decoder[DirectorPermissionSummary] = deriveDecoder
}
