package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.support.buttontemplates.ButtonTemplateAccess

/** 总监按 templateId 读取按钮模板 APIMessage。
  *
  * 定义：/admin/director/ui/button-templates 相关路由。
  * 作用：按钮视觉模板的 CRUD 操作之一。
  * 关联：ButtonTemplateTable；DirectorWorkbench 按钮模板管理。
  */
final case class GetButtonTemplateAPIMessage(
  userId: String,
  templateId: String
) extends APIWithTokenMessage[ButtonTemplate] {
  override def token: String = userId

  /** 执行按钮模板业务逻辑。
    *
    * 实现：requireAdminLevel(Director) → findById → RowMapper；404 映射 ButtonTemplateNotFound。
    * 关联：userId 取自 header。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ButtonTemplate]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        // 查找并转为 ButtonTemplate
        template <- PlanSteps.fromEither(ButtonTemplateAccess.requireTemplate(connection, templateId))
      } yield template
    }
}
