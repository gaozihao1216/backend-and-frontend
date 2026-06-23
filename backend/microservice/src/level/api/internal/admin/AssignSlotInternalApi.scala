package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.inventory.BirdPool
import microservice.level.objects.slot.SlotAssignment
import microservice.level.support.admin.SlotAssignmentSupport

/** 模块间 API：分配关卡槽位；由 admin HTTP API 调用，不挂路由。 */
final case class AssignSlotInternalAPIMessage(
  levelSuffix: String,
  submissionId: String,
  assignedById: String,
  note: Option[String],
  birdPool: BirdPool
) extends APIMessage[SlotAssignment] {
  override def plan(connection: Connection): IO[Either[HttpError, SlotAssignment]] =
    PlanSteps.finish {
      SlotAssignmentSupport.requireAssign(connection, levelSuffix, submissionId, assignedById, note, birdPool)
    }
}
