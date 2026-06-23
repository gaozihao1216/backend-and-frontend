package microservice.admin.objects.director.permissions

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.AdminLevel

/** 总监权限摘要 DTO。
  *
  * 领域含义：返回当前用户的 adminLevel 及 UI 定制能力标志，供前端决定展示哪些总监功能。
  * 字段：userId 当前用户；adminLevel 应为 Director；canManageUiCustomization 是否可管理 UI。
  * 使用者：GetDirectorPermissionsAPIMessage；前端 Director 面板初始化。
  */
final case class DirectorPermissionSummary(
  userId: String,
  adminLevel: AdminLevel,
  canManageUiCustomization: Boolean
)

/** DirectorPermissionSummary 的 Circe 编解码 companion。 */
private[admin] object DirectorPermissionSummary {
  implicit val encoder: Encoder[DirectorPermissionSummary] = deriveEncoder
  implicit val decoder: Decoder[DirectorPermissionSummary] = deriveDecoder
}
