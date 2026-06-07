package microservice.bird.tables

import microservice.infrastructure.database.InMemoryStore
import microservice.system.objects.LevelStatus
import io.circe.syntax._
import java.sql.Connection
import java.time.Instant

object BirdDesignTable {
  val defaultPreviewImageUrl: String =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='120' cy='120' r='88' fill='%23dbeafe'/%3E%3Ctext x='120' y='128' text-anchor='middle' font-size='28' fill='%231e3a8a'%3E%E9%B8%9F%3C/text%3E%3C/svg%3E"

  private def isInMemory(connection: Connection): Boolean = connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS bird_designs (
              id TEXT PRIMARY KEY,
              author_id TEXT NOT NULL REFERENCES users(id),
              name TEXT NOT NULL,
              summary TEXT NOT NULL,
              skill_name TEXT NOT NULL,
              attack INTEGER NOT NULL,
              impact INTEGER NOT NULL,
              speed INTEGER NOT NULL,
              tier_skills_json TEXT NOT NULL,
              preview_image_url TEXT NOT NULL,
              mechanism_tags_json TEXT NOT NULL DEFAULT '[]',
              status TEXT NOT NULL,
              rejection_reason TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              published_at TEXT
            )
          """
        )
      } finally {
        statement.close()
      }
    }

  def nextId(connection: Connection): String = {
    val count =
      if (isInMemory(connection)) InMemoryStore.birdDesigns.size
      else {
        val statement = connection.prepareStatement("SELECT COUNT(*) AS design_count FROM bird_designs")
        try {
          val resultSet = statement.executeQuery()
          try if (resultSet.next()) resultSet.getInt("design_count") else 0
          finally resultSet.close()
        } finally {
          statement.close()
        }
      }
    f"bird-design-${count + 1}%04d"
  }

  def insert(connection: Connection, row: BirdDesignRow): BirdDesignRow =
    if (isInMemory(connection)) {
      InMemoryStore.birdDesigns = InMemoryStore.birdDesigns :+ row
      row
    } else {
      val statement = connection.prepareStatement(
        """
          INSERT INTO bird_designs (
            id, author_id, name, summary, skill_name, attack, impact, speed,
            tier_skills_json, preview_image_url, mechanism_tags_json, status,
            rejection_reason, created_at, updated_at, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
      )
      try {
        bindDesignRow(statement, row)
        statement.executeUpdate()
        row
      } finally {
        statement.close()
      }
    }

  def listPublished(connection: Connection): Vector[BirdDesignRow] =
    if (isInMemory(connection)) {
      InMemoryStore.birdDesigns.filter(_.status == LevelStatus.Published)
    } else {
      val statement = connection.prepareStatement(
        """
          SELECT id, author_id, name, summary, skill_name, attack, impact, speed,
                 tier_skills_json, preview_image_url, mechanism_tags_json, status,
                 rejection_reason, created_at, updated_at, published_at
          FROM bird_designs
          WHERE status = ?
          ORDER BY published_at DESC NULLS LAST, updated_at DESC, id DESC
        """
      )
      try {
        statement.setString(1, LevelStatus.Published.value)
        val resultSet = statement.executeQuery()
        try {
          val builder = Vector.newBuilder[BirdDesignRow]
          while (resultSet.next()) builder += readDesignRow(resultSet)
          builder.result()
        } finally {
          resultSet.close()
        }
      } finally {
        statement.close()
      }
    }

  def findById(connection: Connection, designId: String): Option[BirdDesignRow] =
    if (isInMemory(connection)) InMemoryStore.birdDesigns.find(_.id == designId)
    else {
      val statement = connection.prepareStatement(
        """
          SELECT id, author_id, name, summary, skill_name, attack, impact, speed,
                 tier_skills_json, preview_image_url, mechanism_tags_json, status,
                 rejection_reason, created_at, updated_at, published_at
          FROM bird_designs WHERE id = ?
        """
      )
      try {
        statement.setString(1, designId)
        val resultSet = statement.executeQuery()
        try if (resultSet.next()) Some(readDesignRow(resultSet)) else None
        finally resultSet.close()
      } finally {
        statement.close()
      }
    }

  def listByAuthor(connection: Connection, authorId: String, status: Option[LevelStatus]): Vector[BirdDesignRow] = {
    val rows =
      if (isInMemory(connection)) InMemoryStore.birdDesigns.filter(_.authorId == authorId)
      else {
        val sql =
          status match {
            case Some(value) =>
              """
                SELECT id, author_id, name, summary, skill_name, attack, impact, speed,
                       tier_skills_json, preview_image_url, mechanism_tags_json, status,
                       rejection_reason, created_at, updated_at, published_at
                FROM bird_designs
                WHERE author_id = ? AND status = ?
                ORDER BY updated_at DESC, id DESC
              """
            case None =>
              """
                SELECT id, author_id, name, summary, skill_name, attack, impact, speed,
                       tier_skills_json, preview_image_url, mechanism_tags_json, status,
                       rejection_reason, created_at, updated_at, published_at
                FROM bird_designs
                WHERE author_id = ?
                ORDER BY updated_at DESC, id DESC
              """
          }
        val statement = connection.prepareStatement(sql)
        try {
          statement.setString(1, authorId)
          status.foreach(value => statement.setString(2, value.value))
          val resultSet = statement.executeQuery()
          try {
            val builder = Vector.newBuilder[BirdDesignRow]
            while (resultSet.next()) builder += readDesignRow(resultSet)
            builder.result()
          } finally {
            resultSet.close()
          }
        } finally {
          statement.close()
        }
      }
    status match {
      case Some(value) => rows.filter(_.status == value)
      case None => rows
    }
  }

  def updateEditable(connection: Connection, row: BirdDesignRow): Option[BirdDesignRow] =
    findById(connection, row.id).flatMap { existing =>
      if (existing.authorId != row.authorId) None
      else if (existing.status != LevelStatus.Draft && existing.status != LevelStatus.Rejected) None
      else {
        if (isInMemory(connection)) {
          InMemoryStore.birdDesigns =
            InMemoryStore.birdDesigns.filterNot(_.id == row.id) :+ row
          Some(row)
        } else {
          val statement = connection.prepareStatement(
            """
              UPDATE bird_designs SET
                name = ?, summary = ?, skill_name = ?, attack = ?, impact = ?, speed = ?,
                tier_skills_json = ?, preview_image_url = ?, mechanism_tags_json = ?,
                status = ?, rejection_reason = ?, updated_at = ?, published_at = ?
              WHERE id = ?
            """
          )
          try {
            statement.setString(1, row.name)
            statement.setString(2, row.summary)
            statement.setString(3, row.skillName)
            statement.setInt(4, row.attack)
            statement.setInt(5, row.impact)
            statement.setInt(6, row.speed)
            statement.setString(7, row.tierSkillsJson)
            statement.setString(8, row.previewImageUrl)
            statement.setString(9, row.mechanismTagsJson)
            statement.setString(10, row.status.value)
            row.rejectionReason match {
              case Some(reason) => statement.setString(11, reason)
              case None => statement.setNull(11, java.sql.Types.VARCHAR)
            }
            statement.setString(12, row.updatedAt)
            row.publishedAt match {
              case Some(value) => statement.setString(13, value)
              case None => statement.setNull(13, java.sql.Types.VARCHAR)
            }
            statement.setString(14, row.id)
            if (statement.executeUpdate() > 0) Some(row) else None
          } finally {
            statement.close()
          }
        }
      }
    }

  def updateSubmissionStatus(
    connection: Connection,
    designId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[BirdDesignRow] =
    findById(connection, designId).flatMap { existing =>
      val updated = existing.copy(status = status, rejectionReason = rejectionReason, updatedAt = updatedAt)
      if (isInMemory(connection)) {
        InMemoryStore.birdDesigns = InMemoryStore.birdDesigns.filterNot(_.id == designId) :+ updated
        Some(updated)
      } else {
        val statement = connection.prepareStatement(
          """
            UPDATE bird_designs
            SET status = ?, rejection_reason = ?, updated_at = ?
            WHERE id = ?
          """
        )
        try {
          statement.setString(1, status.value)
          rejectionReason match {
            case Some(reason) => statement.setString(2, reason)
            case None => statement.setNull(2, java.sql.Types.VARCHAR)
          }
          statement.setString(3, updatedAt)
          statement.setString(4, designId)
          if (statement.executeUpdate() > 0) Some(updated) else None
        } finally {
          statement.close()
        }
      }
    }

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
      if (isInMemory(connection)) {
        InMemoryStore.birdDesigns = InMemoryStore.birdDesigns.filterNot(_.id == designId) :+ updated
        Some(updated)
      } else {
        val statement = connection.prepareStatement(
          """
            UPDATE bird_designs
            SET status = ?, rejection_reason = ?, published_at = ?, updated_at = ?
            WHERE id = ?
          """
        )
        try {
          statement.setString(1, status.value)
          rejectionReason match {
            case Some(reason) => statement.setString(2, reason)
            case None => statement.setNull(2, java.sql.Types.VARCHAR)
          }
          publishedAt match {
            case Some(value) => statement.setString(3, value)
            case None => statement.setNull(3, java.sql.Types.VARCHAR)
          }
          statement.setString(4, updatedAt)
          statement.setString(5, designId)
          if (statement.executeUpdate() > 0) Some(updated) else None
        } finally {
          statement.close()
        }
      }
    }

  def deleteDraft(connection: Connection, designId: String, authorId: String): Boolean =
    findById(connection, designId) match {
      case Some(row) if row.authorId == authorId && row.status == LevelStatus.Draft =>
        if (isInMemory(connection)) {
          InMemoryStore.birdDesigns = InMemoryStore.birdDesigns.filterNot(_.id == designId)
          true
        } else {
          val statement = connection.prepareStatement("DELETE FROM bird_designs WHERE id = ? AND author_id = ?")
          try {
            statement.setString(1, designId)
            statement.setString(2, authorId)
            statement.executeUpdate() > 0
          } finally {
            statement.close()
          }
        }
      case _ => false
    }

  private def bindDesignRow(statement: java.sql.PreparedStatement, row: BirdDesignRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.authorId)
    statement.setString(3, row.name)
    statement.setString(4, row.summary)
    statement.setString(5, row.skillName)
    statement.setInt(6, row.attack)
    statement.setInt(7, row.impact)
    statement.setInt(8, row.speed)
    statement.setString(9, row.tierSkillsJson)
    statement.setString(10, row.previewImageUrl)
    statement.setString(11, row.mechanismTagsJson)
    statement.setString(12, row.status.value)
    row.rejectionReason match {
      case Some(reason) => statement.setString(13, reason)
      case None => statement.setNull(13, java.sql.Types.VARCHAR)
    }
    statement.setString(14, row.createdAt)
    statement.setString(15, row.updatedAt)
    row.publishedAt match {
      case Some(value) => statement.setString(16, value)
      case None => statement.setNull(16, java.sql.Types.VARCHAR)
    }
  }

  private def readDesignRow(resultSet: java.sql.ResultSet): BirdDesignRow =
    BirdDesignRow(
      id = resultSet.getString("id"),
      authorId = resultSet.getString("author_id"),
      name = resultSet.getString("name"),
      summary = resultSet.getString("summary"),
      skillName = resultSet.getString("skill_name"),
      attack = resultSet.getInt("attack"),
      impact = resultSet.getInt("impact"),
      speed = resultSet.getInt("speed"),
      tierSkillsJson = resultSet.getString("tier_skills_json"),
      previewImageUrl = resultSet.getString("preview_image_url"),
      mechanismTagsJson = resultSet.getString("mechanism_tags_json"),
      status = LevelStatus.fromString(resultSet.getString("status")).getOrElse(LevelStatus.Draft),
      rejectionReason = Option(resultSet.getString("rejection_reason")),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at"),
      publishedAt = Option(resultSet.getString("published_at"))
    )
}
