package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** POST /admin/director/ui/pages 的 APIMessage：创建新页面配置；id 不可重复。 */
final case class CreateUiPageAPIMessage(
  userId: String,
  body: CreateUiPageBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        _ <- PlanSteps.require(
          if (UiPageTable.findById(connection, body.page.id).nonEmpty) {
            Left(UiCustomizationErrors.PageAlreadyExists(body.page.id).toHttpError)
          } else if (body.page.id.trim.isEmpty || body.page.name.trim.isEmpty || body.page.path.trim.isEmpty) {
            Left(UiCustomizationErrors.InvalidPageConfig("id, name and path are required").toHttpError)
          } else {
            Right(())
          }
        )
        page <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val row = UiPageTable.insert(
            connection,
            UiPageRowMapper.fromPageConfig(body.page.copy(
              id = body.page.id.trim,
              name = body.page.name.trim,
              path = body.page.path.trim
            ), createdAt = timestamp, updatedAt = timestamp)
          )
          UiPageRowMapper.toPageConfig(row)
        }
      } yield page
    }
}
