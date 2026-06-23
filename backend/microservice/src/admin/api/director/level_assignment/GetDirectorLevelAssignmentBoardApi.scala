package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.board.DirectorLevelAssignmentBoard
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel

/** GET /admin/director/level-assignments/board — 拉取关卡槽位分配看板。 */
final case class GetDirectorLevelAssignmentBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorLevelAssignmentBoard] {
  override def token: String = userId

  /** plan：校验 Director 权限 → DirectorLevelAssignmentSupport.buildBoard（只读）。
    *
    * 关联：前端 `GetDirectorLevelAssignmentBoardApi`；响应结构见 [[DirectorLevelAssignmentBoard]]。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorLevelAssignmentBoard]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        board <- PlanSteps.read(DirectorLevelAssignmentSupport.buildBoard(connection))
      } yield board
    }
}
