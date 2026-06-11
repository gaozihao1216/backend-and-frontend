package microservice.admin.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.admin.objects.{DirectorTransferResult, TransferDirectorPermissionErrors}
import microservice.user.tables.user.UserTable
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, UserRole}
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

/** 将总监权限移交给另一位 Admin：当前用户降为 Standard，目标用户升为 Director。
  *
  * 实现：
  *   1. requireAdminLevel(Director) 且不可 transfer 给自己
  *   2. 校验 target 存在且 role == Admin
  *   3. 原子更新双方 adminLevel（失败则 DIRECTOR_TRANSFER_FAILED）
  * 关联：POST /admin/director/transfer；TransferDirectorPermissionErrors 定义业务错误码。
  */
final case class TransferDirectorPermissionAPIMessage(
  currentDirectorId: String,
  body: TransferDirectorPermissionBody
) extends APIWithTokenMessage[DirectorTransferResult] {
  override def token: String = currentDirectorId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorTransferResult]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, currentDirectorId, AdminLevel.Director).flatMap { _ =>
        if (body.targetAdminId == currentDirectorId) {
          Left(TransferDirectorPermissionErrors.CannotTransferToSelf.toHttpError)
        } else {
          UserTable.findById(connection, body.targetAdminId) match {
            case None =>
              Left(TransferDirectorPermissionErrors.TargetMissing(body.targetAdminId).toHttpError)
            case Some(target) if target.role != UserRole.Admin =>
              Left(TransferDirectorPermissionErrors.TargetNotAdmin(body.targetAdminId).toHttpError)
            case Some(_) =>
              val timestamp = Instant.now().toString
              val demoted = UserTable.updateAdminLevel(connection, currentDirectorId, Some(AdminLevel.Standard), timestamp)
              val promoted = UserTable.updateAdminLevel(connection, body.targetAdminId, Some(AdminLevel.Director), timestamp)

              (demoted, promoted) match {
                case (Some(_), Some(_)) =>
                  Right(DirectorTransferResult(currentDirectorId, body.targetAdminId))
                case _ =>
                  Left(TransferDirectorPermissionErrors.TransferFailed(body.targetAdminId).toHttpError)
              }
          }
        }
      }
    }
}
