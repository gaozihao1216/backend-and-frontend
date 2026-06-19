package microservice.ui.api.buttontemplates

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.ButtonTemplate
import microservice.ui.tables.button_template.{ButtonTemplateRowMapper, ButtonTemplateTable}

/** 总监列出全部按钮模板 APIMessage。
  *
  * 定义：/admin/director/ui/button-templates 相关路由。
  * 作用：按钮视觉模板的 CRUD 操作之一。
  * 关联：ButtonTemplateTable；DirectorWorkbench 按钮模板管理。
  */
final case class ListButtonTemplatesAPIMessage(
  userId: String
) extends APIWithTokenMessage[List[ButtonTemplate]] {
  override def token: String = userId

  /** 执行按钮模板业务逻辑。
    *
    * 实现：requireAdminLevel(Director) → ButtonTemplateTable.listAll → RowMapper 批量转换。
    * 关联：userId 取自 header。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[ButtonTemplate]]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 列出全部按钮模板
        templates <- PlanSteps.read(
          ButtonTemplateTable.listAll(connection).map(ButtonTemplateRowMapper.toButtonTemplate).toList
        )
      } yield templates
    }
}
