package microservice.ui.tables.ui_page

import microservice.ui.objects.component.PageComponent
import microservice.ui.objects.page.PageLayout
import microservice.ui.objects.endpoint.UiEndpoint
import microservice.ui.objects.page.PageConfig
import io.circe.parser.decode
import io.circe.syntax._
import java.sql.{PreparedStatement, ResultSet, SQLException}
import java.sql.Connection
import java.sql.{Connection, ResultSet}
import microservice.ui.tables.ui_page._

/** UI 页面持久化行（layout/components 以 JSON 嵌入）。
  *
  * 定义：ui_pages 表一行；layout 与 components 列存 JSON。
  * 关联：UiPageRowMapper.toPageConfig 转为 API 领域对象。
  */
final case class UiPageRow(
  /** 页面唯一 id，主键。 */
  id: String,
  /** 页面显示名称。 */
  name: String,
  /** 前端路由 path。 */
  path: String,
  /** 所属角色端点（player/designer/admin/director）。 */
  roleScope: UiEndpoint,
  /** 页面布局 JSON 对象。 */
  layout: PageLayout,
  /** 页面组件列表 JSON 数组。 */
  components: List[PageComponent],
  /** 创建时间 ISO-8601 字符串。 */
  createdAt: String,
  /** 最后更新时间 ISO-8601 字符串。 */
  updatedAt: String
)

object UiPageRowMapper {
  /** UiPageRow → PageConfig 领域对象。 */
  def toPageConfig(row: UiPageRow): PageConfig =
    PageConfig(
      id = row.id,
      name = row.name,
      path = row.path,
      roleScope = row.roleScope,
      layout = row.layout,
      components = row.components
    )

  /** PageConfig → UiPageRow 持久化行（附带时间戳）。 */
  def fromPageConfig(config: PageConfig, createdAt: String, updatedAt: String): UiPageRow =
    UiPageRow(
      id = config.id,
      name = config.name,
      path = config.path,
      roleScope = config.roleScope,
      layout = config.layout,
      components = config.components,
      createdAt = createdAt,
      updatedAt = updatedAt
    )
}

private[tables] object UiPageTableCodec {
  val baseSelect: String =
    """
      SELECT id, name, path, role_scope, layout, components, created_at, updated_at
      FROM ui_pages
    """

  /** PageLayout 序列化为 JSON 字符串写入 layout 列。 */
  def layoutToDb(layout: PageLayout): String =
    layout.asJson.noSpaces

  /** PageComponent 列表序列化为 JSON 字符串写入 components 列。 */
  def componentsToDb(components: List[PageComponent]): String =
    components.asJson.noSpaces

  /** 将 UiPageRow 绑定到 INSERT/UPDATE PreparedStatement 占位符。 */
  def bindRow(statement: PreparedStatement, row: UiPageRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.name)
    statement.setString(3, row.path)
    statement.setString(4, row.roleScope.value)
    statement.setString(5, layoutToDb(row.layout))
    statement.setString(6, componentsToDb(row.components))
    statement.setString(7, row.createdAt)
    statement.setString(8, row.updatedAt)
  }

  /** 从 ResultSet 解析单行 UiPageRow（含 JSON 反序列化 layout/components）。 */
  def rowFromResultSet(resultSet: ResultSet): UiPageRow =
    UiPageRow(
      id = resultSet.getString("id"),
      name = resultSet.getString("name"),
      path = resultSet.getString("path"),
      roleScope = UiEndpoint.fromString(resultSet.getString("role_scope")).getOrElse(
        throw new SQLException(s"Unknown UI endpoint: ${resultSet.getString("role_scope")}")
      ),
      layout = layoutFromDb(resultSet.getString("layout")),
      components = componentsFromDb(resultSet.getString("components")),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )

  private def layoutFromDb(value: String): PageLayout =
    decode[PageLayout](value).fold(
      error => throw new SQLException(s"Invalid UI page layout JSON: ${error.getMessage}", error),
      identity
    )

  private def componentsFromDb(value: String): List[PageComponent] =
    decode[List[PageComponent]](value).fold(
      error => throw new SQLException(s"Invalid UI page components JSON: ${error.getMessage}", error),
      identity
    )
}

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
