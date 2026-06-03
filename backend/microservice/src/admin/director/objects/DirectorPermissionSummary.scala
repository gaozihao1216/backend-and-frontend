package microservice.admin.director.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.AdminLevel

final case class DirectorPermissionSummary(
  userId: String,
  adminLevel: AdminLevel,
  canManageUiCustomization: Boolean
)

object DirectorPermissionSummary {
  implicit val encoder: Encoder[DirectorPermissionSummary] = deriveEncoder
  implicit val decoder: Decoder[DirectorPermissionSummary] = deriveDecoder
}
