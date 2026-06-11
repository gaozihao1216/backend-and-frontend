package microservice.ui.tables.stretch_visual_template

import microservice.ui.tables.stretch_visual_template.inmemory._
import microservice.ui.tables.stretch_visual_template.jdbc._

import java.sql.Connection
import microservice.ui.objects.StretchVisualTemplateKind

/** 拉伸视觉模板表访问门面：面板（panel）与图案（pattern）两类可拉伸背景资源。
  *
  * 路由层以 /panel-templates 与 /pattern-templates 区分 kind；存储共用一张表。
  */
object StretchVisualTemplateTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) StretchVisualTemplateTableJdbcSchema.initialize(connection)

  /** 按 kind 过滤返回模板列表。 */
  def listByKind(connection: Connection, kind: StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.listByKind(kind)
    else StretchVisualTemplateTableJdbcRead.listByKind(connection, kind)

  /** 按 templateId 查找模板（不区分 kind）。 */
  def findById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.findById(templateId)
    else StretchVisualTemplateTableJdbcRead.findById(connection, templateId)

  /** 插入新拉伸视觉模板。 */
  def insert(connection: Connection, row: StretchVisualTemplateRow): StretchVisualTemplateRow =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.insert(row)
    else StretchVisualTemplateTableJdbcWrite.insert(connection, row)

  /** 更新已有模板；不存在时返回 None。 */
  def update(connection: Connection, row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.update(row)
    else StretchVisualTemplateTableJdbcWrite.update(connection, row)

  /** 按 templateId 删除模板并返回被删行。 */
  def deleteById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (isInMemory(connection)) StretchVisualTemplateTableInMemory.deleteById(templateId)
    else StretchVisualTemplateTableJdbcWrite.deleteById(connection, templateId)
}
