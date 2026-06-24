package microservice.player.tables.weekly_check_in

import java.sql.ResultSet
import java.sql.Connection
import java.time.Instant
import microservice.player.objects.WeeklyCheckInProgress
import microservice.player.tables.weekly_check_in._

final case class PlayerWeeklyCheckInRow(
  userId: String,
  weekKey: String,
  signedSlots: String,
  signedToday: Boolean,
  updatedAt: String
)

private[player] object PlayerWeeklyCheckInSlotsCodec {
  def encode(slots: Set[Int]): String =
    slots.toVector.sorted.mkString(",")

  def decode(raw: String): Set[Int] =
    if (raw.trim.isEmpty) Set.empty
    else raw.split(",").flatMap(value => scala.util.Try(value.trim.toInt).toOption).toSet
}

private[player] object PlayerWeeklyCheckInTableCodec {
  val baseSelect: String =
    "SELECT user_id, week_key, signed_slots, signed_today, updated_at FROM player_weekly_check_ins"

  def rowFromResultSet(resultSet: ResultSet): PlayerWeeklyCheckInRow =
    PlayerWeeklyCheckInRow(
      userId = resultSet.getString("user_id"),
      weekKey = resultSet.getString("week_key"),
      signedSlots = resultSet.getString("signed_slots"),
      signedToday = resultSet.getBoolean("signed_today"),
      updatedAt = resultSet.getString("updated_at")
    )
}

private[player] object PlayerWeeklyCheckInTable {

  def getOrCreate(connection: Connection, userId: String, weekKey: String): WeeklyCheckInProgress =
    PlayerWeeklyCheckInTableSql.findByUserAndWeek(connection, userId, weekKey) match {
      case Some(row) =>
        WeeklyCheckInProgress(
          weekKey = row.weekKey,
          signedSlots = PlayerWeeklyCheckInSlotsCodec.decode(row.signedSlots),
          signedToday = row.signedToday
        )
      case None =>
        WeeklyCheckInProgress(weekKey = weekKey)
    }

  def save(connection: Connection, userId: String, progress: WeeklyCheckInProgress): WeeklyCheckInProgress = {
    val row = PlayerWeeklyCheckInRow(
      userId = userId,
      weekKey = progress.weekKey,
      signedSlots = PlayerWeeklyCheckInSlotsCodec.encode(progress.signedSlots),
      signedToday = progress.signedToday,
      updatedAt = Instant.now().toString
    )
    PlayerWeeklyCheckInTableSql.upsert(connection, row)
    progress
  }
}


private[tables] object PlayerWeeklyCheckInTableSql {

def findByUserAndWeek(connection: Connection, userId: String, weekKey: String): Option[PlayerWeeklyCheckInRow] = {
    val statement =
      connection.prepareStatement(s"${PlayerWeeklyCheckInTableCodec.baseSelect} WHERE user_id = ? AND week_key = ?")
    try {
      statement.setString(1, userId)
      statement.setString(2, weekKey)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerWeeklyCheckInTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

def upsert(connection: Connection, row: PlayerWeeklyCheckInRow): PlayerWeeklyCheckInRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_weekly_check_ins (user_id, week_key, signed_slots, signed_today, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (user_id, week_key) DO UPDATE SET
          signed_slots = EXCLUDED.signed_slots,
          signed_today = EXCLUDED.signed_today,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setString(2, row.weekKey)
      statement.setString(3, row.signedSlots)
      statement.setBoolean(4, row.signedToday)
      statement.setString(5, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
