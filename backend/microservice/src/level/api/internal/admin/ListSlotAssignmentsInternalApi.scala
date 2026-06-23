package microservice.level.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.slot.SlotAssignment
import microservice.level.support.admin.SlotAssignmentSupport

/** 模块间 API：列出全部槽位分配；由 admin HTTP API 调用，不挂路由。 */
final case class ListSlotAssignmentsInternalAPIMessage() extends APIMessage[List[SlotAssignment]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[SlotAssignment]]] =
    PlanSteps.finish {
      PlanSteps.read(SlotAssignmentSupport.listAll(connection))
    }
}
