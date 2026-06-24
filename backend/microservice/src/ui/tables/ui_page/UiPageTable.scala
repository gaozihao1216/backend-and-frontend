package microservice.ui.tables.ui_page

import java.sql.Connection
import java.sql.{Connection, ResultSet}
import microservice.ui.objects.component.PageComponent
import microservice.ui.objects.UiEndpoint
import microservice.ui.tables.ui_page._

object UiPageTable {
/** 创建 ui_pages 表及 role_scope 索引。 */

/** 查询全部页面行，按 id 升序。 */
  def listAll(connection: Connection): Vector[UiPageRow] = {
    val statement = connection.prepareStatement(s"${UiPageTableCodec.baseSelect} ORDER BY id ASC")
    try rows(statement.executeQuery())
    finally statement.close()
  }

  /** 按 role_scope 过滤页面列表。 */
  def listByEndpoint(connection: Connection, endpoint: UiEndpoint): Vector[UiPageRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${UiPageTableCodec.baseSelect}
        WHERE role_scope = ?
        ORDER BY id ASC
      """
    )
    try {
      statement.setString(1, endpoint.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  /** 按 id 查询单页配置。 */
  def findById(connection: Connection, pageId: String): Option[UiPageRow] = {
    val statement = connection.prepareStatement(s"${UiPageTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, pageId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(UiPageTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  /** 遍历 ResultSet 批量解析 UiPageRow。 */
  private def rows(resultSet: ResultSet): Vector[UiPageRow] =
    try {
      val builder = Vector.newBuilder[UiPageRow]
      while (resultSet.next()) {
        builder += UiPageTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }

/** INSERT 新页面行。 */
  def insert(connection: Connection, row: UiPageRow): UiPageRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ui_pages (id, name, path, role_scope, layout, components, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      UiPageTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  /** UPDATE 已有页面行；影响行数为 0 时返回 None。 */
  def update(connection: Connection, row: UiPageRow): Option[UiPageRow] = {
    val statement = connection.prepareStatement(
      """
        UPDATE ui_pages
        SET name = ?, path = ?, role_scope = ?, layout = ?, components = ?, created_at = ?, updated_at = ?
        WHERE id = ?
      """
    )
    try {
      statement.setString(1, row.name)
      statement.setString(2, row.path)
      statement.setString(3, row.roleScope.value)
      statement.setString(4, UiPageTableCodec.layoutToDb(row.layout))
      statement.setString(5, UiPageTableCodec.componentsToDb(row.components))
      statement.setString(6, row.createdAt)
      statement.setString(7, row.updatedAt)
      statement.setString(8, row.id)
      if (statement.executeUpdate() == 0) None else Some(row)
    } finally {
      statement.close()
    }
  }

  /** DELETE 页面行；先 read 再 delete 返回被删行。 */
  def deleteById(connection: Connection, pageId: String): Option[UiPageRow] =
    UiPageTable.findById(connection, pageId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_pages WHERE id = ?")
      try {
        statement.setString(1, pageId)
        if (statement.executeUpdate() == 0) None else Some(row)
      } finally {
        statement.close()
      }
    }

  /** 向页面 components JSON 追加组件。 */
  def addComponent(connection: Connection, pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    UiPageTable.findById(connection, pageId).filterNot(_.components.exists(_.id == component.id)).flatMap { row =>
      update(connection, row.copy(components = row.components :+ component, updatedAt = updatedAt))
    }

  /** 替换页面内指定 id 的组件。 */
  def updateComponent(connection: Connection, pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    UiPageTable.findById(connection, pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(connection, row.copy(
        components = row.components.map(existing => if (existing.id == componentId) component else existing),
        updatedAt = updatedAt
      ))
    }

  /** 从页面 components 中移除指定组件。 */
  def deleteComponent(connection: Connection, pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    UiPageTable.findById(connection, pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(connection, row.copy(
        components = row.components.filterNot(_.id == componentId),
        updatedAt = updatedAt
      ))
    }
}
