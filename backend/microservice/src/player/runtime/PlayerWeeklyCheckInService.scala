package microservice.player.runtime

import microservice.infrastructure.http.HttpError
import microservice.player.tables.{CheckInPanelRewardTable, PlayerWalletTable, PlayerWeeklyCheckInTable}
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import java.time.{DayOfWeek, LocalDate, ZoneOffset}

object PlayerWeeklyCheckInService {
  private val WeeklyCheckInDataKey = "player.weeklyCheckIn"
  private val WeeklyCheckInClaimActionKey = "player.weeklyCheckIn.claim"

  val dataApiKey: String = WeeklyCheckInDataKey

  val claimActionKey: String = WeeklyCheckInClaimActionKey

  def getData(connection: Connection, userId: String): Either[HttpError, Json] =
    Right(buildPayload(connection, userId, panelId = None))

  def getDataForPanel(connection: Connection, userId: String, panelId: String): Either[HttpError, Json] =
    Right(buildPayload(connection, userId, Some(panelId)))

  def executeClaim(connection: Connection, userId: String, params: Map[String, String]): Either[HttpError, Json] = {
    val panelId = params.getOrElse("panelId", PlayerRuntimeDefaults.roleHomeCheckInPanelId)
    val slot = params.get("slot").flatMap(value => scala.util.Try(value.toInt).toOption).getOrElse(0)

    if (panelId.isEmpty || slot < 1 || slot > 7) {
      return Left(HttpError.badRequest("INVALID_CHECK_IN_PARAMS", "panelId and slot (1-7) are required"))
    }

    val weekKey = currentWeekKey()
    val progress = currentProgress(connection, userId, weekKey)
    val signedCount = progress.signedSlots.size
    val activeSlot =
      if (!progress.signedToday && signedCount < 7) signedCount + 1
      else -1

    if (slot != activeSlot) {
      return Left(HttpError.conflict("CHECK_IN_SLOT_NOT_READY", s"Slot $slot is not claimable right now"))
    }

    val rewards = CheckInPanelRewardTable
      .listByPanelId(connection, panelId)
      .lift(slot - 1)
      .getOrElse(CheckInSlotReward())

    val wallet = PlayerWalletTable.getOrCreate(connection, userId)
    PlayerWalletTable.save(
      connection,
      userId,
      wallet.copy(
        coins = wallet.coins + rewards.coins,
        gems = wallet.gems + rewards.gems,
        fragments = wallet.fragments + rewards.fragments
      )
    )

    PlayerWeeklyCheckInTable.save(
      connection,
      userId,
      progress.copy(
        signedSlots = progress.signedSlots + slot,
        signedToday = true
      )
    )

    Right(buildPayload(connection, userId, Some(panelId)))
  }

  def registerPanelRewards(connection: Connection, panelId: String, slots: Vector[CheckInSlotReward]): Unit =
    CheckInPanelRewardTable.replacePanelRewards(connection, panelId, slots)

  private def buildPayload(connection: Connection, userId: String, panelId: Option[String]): Json = {
    val weekKey = currentWeekKey()
    val progress = currentProgress(connection, userId, weekKey)
    val signedCount = progress.signedSlots.size
    val activeSlot =
      if (!progress.signedToday && signedCount < 7) signedCount + 1
      else -1
    val wallet = PlayerWalletTable.getOrCreate(connection, userId)
    val slotStatuses = (1 to 7).map { slot =>
      val status =
        if (progress.signedSlots.contains(slot)) "claimed"
        else if (slot == activeSlot) "ready"
        else "locked"
      slot.toString -> Json.fromString(status)
    }.toMap

    Json.obj(
      "signedCount" -> Json.fromInt(signedCount),
      "activeSlot" -> Json.fromInt(activeSlot),
      "signedToday" -> Json.fromBoolean(progress.signedToday),
      "wallet" -> Json.obj(
        "coins" -> Json.fromInt(wallet.coins),
        "gems" -> Json.fromInt(wallet.gems),
        "fragments" -> Json.fromInt(wallet.fragments)
      ),
      "slots" -> Json.obj(slotStatuses.toSeq: _*),
      "panelId" -> panelId.fold(Json.Null)(Json.fromString)
    )
  }

  private def currentProgress(connection: Connection, userId: String, weekKey: String): WeeklyCheckInProgress =
    PlayerWeeklyCheckInTable.getOrCreate(connection, userId, weekKey)

  private def currentWeekKey(): String = {
    val today = LocalDate.now(ZoneOffset.UTC)
    val weekStart = today.`with`(DayOfWeek.MONDAY)
    weekStart.toString
  }
}
