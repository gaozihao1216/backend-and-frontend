package microservice.ui.tables.button_template

import microservice.ui.tables.button_template.inmemory._
import microservice.ui.tables.button_template.jdbc._

import java.sql.Connection

/** 按钮视觉模板表访问门面：九宫格切片等按钮皮肤资源的 CRUD。
  *
  * 总监在 DirectorWorkbench 中管理；动态页面 ButtonComponent 通过 templateId 引用。
  */
object ButtonTemplateTable {
  /** 判断当前是否为 InMemory 模式（connection == null）。 */
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) ButtonTemplateTableJdbcSchema.initialize(connection)

  /** 返回全部按钮模板。 */
  def listAll(connection: Connection): Vector[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.listAll()
    else ButtonTemplateTableJdbcRead.listAll(connection)

  /** 按 templateId 查找按钮模板。 */
  def findById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.findById(templateId)
    else ButtonTemplateTableJdbcRead.findById(connection, templateId)

  /** 插入新按钮模板。 */
  def insert(connection: Connection, row: ButtonTemplateRow): ButtonTemplateRow =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.insert(row)
    else ButtonTemplateTableJdbcWrite.insert(connection, row)

  /** 更新已有按钮模板；不存在时返回 None。 */
  def update(connection: Connection, row: ButtonTemplateRow): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.update(row)
    else ButtonTemplateTableJdbcWrite.update(connection, row)

  /** 按 templateId 删除按钮模板并返回被删行。 */
  def deleteById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (isInMemory(connection)) ButtonTemplateTableInMemory.deleteById(templateId)
    else ButtonTemplateTableJdbcWrite.deleteById(connection, templateId)
}
