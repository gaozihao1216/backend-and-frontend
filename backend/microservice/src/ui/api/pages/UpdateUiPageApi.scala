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

/** 总监更新或 upsert 页面配置 APIMessage。
  *
  * 定义：PUT /admin/director/ui/pages/:pageId；body 为 UpdateUiPageBody。
  * 作用：存在则 update，不存在则 insert（upsert 语义）。
  * 关联：与 PublishUiPage 不同，不写入回滚快照。
  */
final case class UpdateUiPageAPIMessage(
  userId: String,
  pageId: String,
  body: UpdateUiPageBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  /** 更新或 upsert 页面配置。
    *
    * 实现：requireAdminLevel(Director) → 校验 name/path → findById 分支 insert/update。
    * 关联：路径 pageId 覆盖 body.page.id。
    */
  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // name 与 path 不可为空
        _ <- PlanSteps.require(
          if (body.page.name.trim.isEmpty || body.page.path.trim.isEmpty) {
            Left(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
          } else {
            Right(())
          }
        )
        // 按是否存在分支 insert 或 update
        page <- PlanSteps.require(
          {
            val updatedConfig = body.page.copy(
              id = pageId,
              name = body.page.name.trim,
              path = body.page.path.trim
            )

            UiPageTable.findById(connection, pageId) match {
              case None =>
                val timestamp = Instant.now().toString
                val inserted = UiPageTable.insert(
                  connection,
                  UiPageRowMapper.fromPageConfig(
                    updatedConfig,
                    createdAt = timestamp,
                    updatedAt = timestamp
                  )
                )
                Right(UiPageRowMapper.toPageConfig(inserted))
              case Some(existing) =>
                UiPageTable
                  .update(
                    connection,
                    UiPageRowMapper.fromPageConfig(
                      updatedConfig,
                      createdAt = existing.createdAt,
                      updatedAt = Instant.now().toString
                    )
                  )
                  .map(row => Right(UiPageRowMapper.toPageConfig(row)))
                  .getOrElse(Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError))
            }
          }
        )
      } yield page
    }
}
