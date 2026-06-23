package microservice.ui.tables.button_template

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.ui.tables.button_template.jdbc.ButtonTemplateTableJdbc

/** 按钮视觉模板表访问门面：九宫格切片等按钮皮肤资源的 CRUD。
  *
  * 总监在 DirectorWorkbench 中管理；动态页面 ButtonComponent 通过 templateId 引用。
  */
object ButtonTemplateTable {
  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) ButtonTemplateTableJdbc.initialize(connection)

  /** 返回全部按钮模板。 */
  def listAll(connection: Connection): Vector[ButtonTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.buttonTemplates.sortBy(_.id)
    } else {
      ButtonTemplateTableJdbc.listAll(connection)
    }

  /** 按 templateId 查找按钮模板。 */
  def findById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.buttonTemplates.find(_.id == templateId)
    } else {
      ButtonTemplateTableJdbc.findById(connection, templateId)
    }

  /** 插入新按钮模板。 */
  def insert(connection: Connection, row: ButtonTemplateRow): ButtonTemplateRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates :+ row
      row
    } else {
      ButtonTemplateTableJdbc.insert(connection, row)
    }

  /** 更新已有按钮模板；不存在时返回 None。 */
  def update(connection: Connection, row: ButtonTemplateRow): Option[ButtonTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.buttonTemplates.indexWhere(_.id == row.id) match {
        case -1 => None
        case index =>
          InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates.updated(index, row)
          Some(row)
      }
    } else {
      ButtonTemplateTableJdbc.update(connection, row)
    }

  /** 按 templateId 删除按钮模板并返回被删行。 */
  def deleteById(connection: Connection, templateId: String): Option[ButtonTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.buttonTemplates.indexWhere(_.id == templateId) match {
        case -1 => None
        case index =>
          val deleted = InMemoryStore.buttonTemplates(index)
          InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates.patch(index, Nil, 1)
          Some(deleted)
      }
    } else {
      ButtonTemplateTableJdbc.deleteById(connection, templateId)
    }
}
