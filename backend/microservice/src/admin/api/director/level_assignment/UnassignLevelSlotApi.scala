package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.UnassignSlotInternalAPIMessage
import microservice.system.objects.AdminLevel

/** DELETE /admin/director/level-assignments/:levelSuffix — 解除槽位关卡分配。 */
final case class UnassignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String
) extends APIWithTokenMessage[LevelSlotAssignment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignment]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- DirectorLevelAssignmentSupport.requireSupportedSuffix(levelSuffix)
        slot <- PlanSteps.runApi(UnassignSlotInternalAPIMessage(levelSuffix), connection)
      } yield LevelHandoffMapping.toSlotAssignment(slot)
    }
}
