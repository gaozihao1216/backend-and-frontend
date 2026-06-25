package microservice.user.api.internal.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.user.objects.handoff.DirectorAdminLevelTransferResult
import microservice.user.tables.user.UserTable

/** 模块间 API：原子交换总监 adminLevel；由 admin HTTP API 调用，不挂路由。 */
final case class TransferDirectorAdminLevelInternalAPIMessage(
  currentDirectorId: String,
  targetAdminId: String
) extends APIMessage[DirectorAdminLevelTransferResult] {
  override def plan(connection: Connection): IO[Either[HttpError, DirectorAdminLevelTransferResult]] =
    PlanSteps.finish {
      EitherT.liftF(IO {
        val timestamp = Instant.now().toString
        val demoted = UserTable.updateAdminLevel(connection, currentDirectorId, Some(AdminLevel.Standard), timestamp)
        val promoted = UserTable.updateAdminLevel(connection, targetAdminId, Some(AdminLevel.Director), timestamp)
        (demoted, promoted)
      }).flatMap {
        case (Some(_), Some(_)) =>
          EitherT.rightT[IO, HttpError](
            DirectorAdminLevelTransferResult(fromUserId = currentDirectorId, toUserId = targetAdminId)
          )
        case _ =>
          EitherT.leftT[IO, DirectorAdminLevelTransferResult](
            HttpError.conflict("DIRECTOR_TRANSFER_FAILED", s"Failed to transfer director permission to: $targetAdminId")
          )
      }
    }
}
