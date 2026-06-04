package microservice.ui.tables

import java.sql.Connection
import microservice.ui.objects.PageComponent

private[tables] object UiPageTableJdbcWrite {
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

  def deleteById(connection: Connection, pageId: String): Option[UiPageRow] =
    UiPageTableJdbcRead.findById(connection, pageId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_pages WHERE id = ?")
      try {
        statement.setString(1, pageId)
        if (statement.executeUpdate() == 0) None else Some(row)
      } finally {
        statement.close()
      }
    }

  def addComponent(connection: Connection, pageId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    UiPageTableJdbcRead.findById(connection, pageId).filterNot(_.components.exists(_.id == component.id)).flatMap { row =>
      update(connection, row.copy(components = row.components :+ component, updatedAt = updatedAt))
    }

  def updateComponent(connection: Connection, pageId: String, componentId: String, component: PageComponent, updatedAt: String): Option[UiPageRow] =
    UiPageTableJdbcRead.findById(connection, pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(connection, row.copy(
        components = row.components.map(existing => if (existing.id == componentId) component else existing),
        updatedAt = updatedAt
      ))
    }

  def deleteComponent(connection: Connection, pageId: String, componentId: String, updatedAt: String): Option[UiPageRow] =
    UiPageTableJdbcRead.findById(connection, pageId).filter(_.components.exists(_.id == componentId)).flatMap { row =>
      update(connection, row.copy(
        components = row.components.filterNot(_.id == componentId),
        updatedAt = updatedAt
      ))
    }
}
