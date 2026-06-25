package microservice.level.api.internal.admin.assignment

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.slot.SlotAssignment
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable

/** 模块间 API：列出全部槽位分配；由 admin HTTP API 调用，不挂路由。 */
final case class ListSlotAssignmentsInternalAPIMessage() extends APIMessage[List[SlotAssignment]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[SlotAssignment]]] =
    PlanSteps.finish {
      PlanSteps.read(LevelSlotAssignmentTable.listAll(connection).map(SlotAssignment.from).toList)
    }
}
