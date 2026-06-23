package microservice.bird.tables.design.jdbc

import java.sql.Connection
import microservice.bird.tables.design.BirdDesignTableCodec
import microservice.bird.tables.shared.BirdDesignRow
import microservice.system.objects.LevelStatus

private[tables] object BirdDesignTableJdbc {
def initialize(connection: Connection): Unit = {
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
    val statement = connection.prepareStatement("SELECT COUNT(*) AS design_count FROM bird_designs")
    try {
      val resultSet = statement.executeQuery()
      try if (resultSet.next()) f"bird-design-${resultSet.getInt("design_count") + 1}%04d" else "bird-design-0001"
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

  def listPublished(connection: Connection): Vector[BirdDesignRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${BirdDesignTableCodec.baseSelect}
        WHERE status = ?
        ORDER BY published_at DESC NULLS LAST, updated_at DESC, id DESC
      """
    )
    try {
      statement.setString(1, LevelStatus.Published.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, designId: String): Option[BirdDesignRow] = {
    val statement = connection.prepareStatement(s"${BirdDesignTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, designId)
      val resultSet = statement.executeQuery()
      try if (resultSet.next()) Some(BirdDesignTableCodec.rowFromResultSet(resultSet)) else None
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

  def listByAuthor(connection: Connection, authorId: String, status: Option[LevelStatus]): Vector[BirdDesignRow] = {
    val sql =
      status match {
        case Some(value) =>
          s"""
            ${BirdDesignTableCodec.baseSelect}
            WHERE author_id = ? AND status = ?
            ORDER BY updated_at DESC, id DESC
          """
        case None =>
          s"""
            ${BirdDesignTableCodec.baseSelect}
            WHERE author_id = ?
            ORDER BY updated_at DESC, id DESC
          """
      }
    val statement = connection.prepareStatement(sql)
    try {
      statement.setString(1, authorId)
      status.foreach(value => statement.setString(2, value.value))
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[BirdDesignRow] =
    try {
      val builder = Vector.newBuilder[BirdDesignRow]
      while (resultSet.next()) builder += BirdDesignTableCodec.rowFromResultSet(resultSet)
      builder.result()
    } finally {
      resultSet.close()
    }

def insert(connection: Connection, row: BirdDesignRow): BirdDesignRow = {
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
      BirdDesignTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def updateEditable(connection: Connection, row: BirdDesignRow): Option[BirdDesignRow] = {
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

  def updateSubmissionStatus(
    connection: Connection,
    designId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Boolean = {
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
      statement.executeUpdate() > 0
    } finally {
      statement.close()
    }
  }

  def updateReviewStatus(
    connection: Connection,
    designId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Boolean = {
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
      statement.executeUpdate() > 0
    } finally {
      statement.close()
    }
  }

  def deleteDraft(connection: Connection, designId: String, authorId: String): Boolean = {
    val statement = connection.prepareStatement("DELETE FROM bird_designs WHERE id = ? AND author_id = ?")
    try {
      statement.setString(1, designId)
      statement.setString(2, authorId)
      statement.executeUpdate() > 0
    } finally {
      statement.close()
    }
  }
}
