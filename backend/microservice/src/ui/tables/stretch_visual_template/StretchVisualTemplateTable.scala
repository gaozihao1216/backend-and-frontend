package microservice.ui.tables.stretch_visual_template

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.tables.stretch_visual_template.jdbc.StretchVisualTemplateTableJdbc

/** 拉伸视觉模板表访问门面：面板（panel）与图案（pattern）两类可拉伸背景资源。
  *
  * 路由层以 /panel-templates 与 /pattern-templates 区分 kind；存储共用一张表。
  */
object StretchVisualTemplateTable {
  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) StretchVisualTemplateTableJdbc.initialize(connection)

  /** 按 kind 过滤返回模板列表。 */
  def listByKind(connection: Connection, kind: StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.stretchVisualTemplates.filter(_.kind == kind).sortBy(_.id)
    } else {
      StretchVisualTemplateTableJdbc.listByKind(connection, kind)
    }

  /** 按 templateId 查找模板（不区分 kind）。 */
  def findById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.stretchVisualTemplates.find(_.id == templateId)
    } else {
      StretchVisualTemplateTableJdbc.findById(connection, templateId)
    }

  /** 插入新拉伸视觉模板。 */
  def insert(connection: Connection, row: StretchVisualTemplateRow): StretchVisualTemplateRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.stretchVisualTemplates = InMemoryStore.stretchVisualTemplates :+ row
      row
    } else {
      StretchVisualTemplateTableJdbc.insert(connection, row)
    }

  /** 更新已有模板；不存在时返回 None。 */
  def update(connection: Connection, row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.stretchVisualTemplates.indexWhere(_.id == row.id) match {
        case -1 => None
        case index =>
          InMemoryStore.stretchVisualTemplates = InMemoryStore.stretchVisualTemplates.updated(index, row)
          Some(row)
      }
    } else {
      StretchVisualTemplateTableJdbc.update(connection, row)
    }

  /** 按 templateId 删除模板并返回被删行。 */
  def deleteById(connection: Connection, templateId: String): Option[StretchVisualTemplateRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.stretchVisualTemplates.indexWhere(_.id == templateId) match {
        case -1 => None
        case index =>
          val deleted = InMemoryStore.stretchVisualTemplates(index)
          InMemoryStore.stretchVisualTemplates = InMemoryStore.stretchVisualTemplates.patch(index, Nil, 1)
          Some(deleted)
      }
    } else {
      StretchVisualTemplateTableJdbc.deleteById(connection, templateId)
    }
}
