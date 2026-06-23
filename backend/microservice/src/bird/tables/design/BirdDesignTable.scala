package microservice.bird.tables.design

import java.sql.Connection
import microservice.bird.tables.design.jdbc.BirdDesignTableJdbc
import microservice.bird.tables.shared.BirdDesignRow
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.system.objects.LevelStatus

/** 鸟类设计表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 间分流。
  *
  * 表：bird_designs；状态复用 LevelStatus（Draft/PendingReview/Published/Rejected）。
  * 关联：DesignerBirdRouter CRUD、ReviewBirdSubmissionAPIMessage 审核、Director bird pool 选项。
  */
object BirdDesignTable {
  /** 未上传预览图时使用的默认 SVG data URL。 */
  val defaultPreviewImageUrl: String =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='120' cy='120' r='88' fill='%23dbeafe'/%3E%3Ctext x='120' y='128' text-anchor='middle' font-size='28' fill='%231e3a8a'%3E%E9%B8%9F%3C/text%3E%3C/svg%3E"

  /** JDBC 启动时建表 bird_designs；in-memory 模式跳过 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) BirdDesignTableJdbc.initialize(connection)

  /** 生成下一个设计 ID，格式 bird-design-0001。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      f"bird-design-${InMemoryStore.birdDesigns.size + 1}%04d"
    } else {
      BirdDesignTableJdbc.nextId(connection)
    }

  /** 插入新设计行，返回写入后的 BirdDesignRow。 */
  def insert(connection: Connection, row: BirdDesignRow): BirdDesignRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdDesigns = InMemoryStore.birdDesigns :+ row
      row
    } else {
      BirdDesignTableJdbc.insert(connection, row)
    }

  /** 列出所有 Published 状态的设计，供 Director bird pool 与玩家 catalog 使用。 */
  def listPublished(connection: Connection): Vector[BirdDesignRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdDesigns.filter(_.status == LevelStatus.Published)
    } else {
      BirdDesignTableJdbc.listPublished(connection)
    }

  /** 按 designId 查询单条设计。 */
  def findById(connection: Connection, designId: String): Option[BirdDesignRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.birdDesigns.find(_.id == designId)
    } else {
      BirdDesignTableJdbc.findById(connection, designId)
    }

  /** 按作者列出设计，可选 status 筛选；按 updated_at 降序。 */
  def listByAuthor(connection: Connection, authorId: String, status: Option[LevelStatus]): Vector[BirdDesignRow] = {
    val rows =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.birdDesigns.filter(_.authorId == authorId)
      } else {
        BirdDesignTableJdbc.listByAuthor(connection, authorId, status)
      }
    status match {
      case Some(value) => rows.filter(_.status == value)
      case None => rows
    }
  }

  /** 更新可编辑设计（Draft/Rejected）：校验 authorId 与状态后全量更新字段。 */
  def updateEditable(connection: Connection, row: BirdDesignRow): Option[BirdDesignRow] =
    findById(connection, row.id).flatMap { existing =>
      if (existing.authorId != row.authorId) None
      else if (existing.status != LevelStatus.Draft && existing.status != LevelStatus.Rejected) None
      else {
        if (TableConnection.isInMemory(connection)) Some(updateInMemoryRow(row))
        else BirdDesignTableJdbc.updateEditable(connection, row)
      }
    }

  /** 提交审核时更新设计状态（如 Draft → PendingReview），不涉及 publishedAt。 */
  def updateSubmissionStatus(
    connection: Connection,
    designId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[BirdDesignRow] =
    findById(connection, designId).flatMap { existing =>
      val updated = existing.copy(status = status, rejectionReason = rejectionReason, updatedAt = updatedAt)
      if (TableConnection.isInMemory(connection)) {
        Some(updateInMemoryRow(updated))
      } else if (BirdDesignTableJdbc.updateSubmissionStatus(connection, designId, status, rejectionReason, updatedAt)) {
        Some(updated)
      } else None
    }

  /** 审核完成后更新设计状态、拒绝原因与发布时间。 */
  def updateReviewStatus(
    connection: Connection,
    designId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[BirdDesignRow] =
    findById(connection, designId).flatMap { existing =>
      val updated = existing.copy(
        status = status,
        rejectionReason = rejectionReason,
        publishedAt = publishedAt,
        updatedAt = updatedAt
      )
      if (TableConnection.isInMemory(connection)) {
        Some(updateInMemoryRow(updated))
      } else if (BirdDesignTableJdbc.updateReviewStatus(connection, designId, status, rejectionReason, publishedAt, updatedAt)) {
        Some(updated)
      } else None
    }

  /** 删除 Draft 设计：校验 authorId 与 Draft 状态，成功返回 true。 */
  def deleteDraft(connection: Connection, designId: String, authorId: String): Boolean =
    findById(connection, designId) match {
      case Some(row) if row.authorId == authorId && row.status == LevelStatus.Draft =>
        if (TableConnection.isInMemory(connection)) deleteInMemoryDraft(designId)
        else BirdDesignTableJdbc.deleteDraft(connection, designId, authorId)
      case _ => false
    }

  private def updateInMemoryRow(row: BirdDesignRow): BirdDesignRow = {
    InMemoryStore.birdDesigns =
      InMemoryStore.birdDesigns.filterNot(_.id == row.id) :+ row
    row
  }

  private def deleteInMemoryDraft(designId: String): Boolean = {
    val before = InMemoryStore.birdDesigns.size
    InMemoryStore.birdDesigns = InMemoryStore.birdDesigns.filterNot(_.id == designId)
    InMemoryStore.birdDesigns.size != before
  }
}
