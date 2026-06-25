package microservice.level.api.internal.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.inventory.BirdPool
import microservice.level.objects.slot.SlotAssignment
import microservice.level.tables.shared.LevelSlotAssignmentRow
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable

/** 模块间 API：更新槽位 bird pool；由 admin HTTP API 调用，不挂路由。 */
final case class UpdateSlotBirdPoolInternalAPIMessage(
  levelSuffix: String,
  birdPool: BirdPool
) extends APIMessage[SlotAssignment] {
  override def plan(connection: Connection): IO[Either[HttpError, SlotAssignment]] =
    PlanSteps.finish {
      for {
        existing <- requireAssignmentForSuffix(connection)
      } yield SlotAssignment.from(LevelSlotAssignmentTable.upsert(connection, existing.copy(birdPool = Some(birdPool))))
    }

  private def requireAssignmentForSuffix(
    connection: Connection
  ): microservice.infrastructure.api.PlanStep.Step[LevelSlotAssignmentRow] =
    EitherT.liftF(IO(LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix))).flatMap {
      case None =>
        EitherT.leftT[IO, LevelSlotAssignmentRow](
          HttpError.notFound("LEVEL_ASSIGNMENT_NOT_FOUND", s"No assignment found for slot: $levelSuffix")
        )
      case Some(row) =>
        EitherT.rightT[IO, HttpError](row)
    }
}
