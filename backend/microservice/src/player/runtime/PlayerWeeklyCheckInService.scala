package microservice.player.runtime

import microservice.infrastructure.database.InMemoryStore
import microservice.infrastructure.http.HttpError
import io.circe.Json
import io.circe.syntax._
import java.time.{DayOfWeek, LocalDate, ZoneOffset}

object PlayerWeeklyCheckInService {
  private val WeeklyCheckInDataKey = "player.weeklyCheckIn"
  private val WeeklyCheckInClaimActionKey = "player.weeklyCheckIn.claim"

  val dataApiKey: String = WeeklyCheckInDataKey

  val claimActionKey: String = WeeklyCheckInClaimActionKey

  def getData(userId: String): Either[HttpError, Json] =
    Right(buildPayload(userId, panelId = None))

  def getDataForPanel(userId: String, panelId: String): Either[HttpError, Json] =
    Right(buildPayload(userId, Some(panelId)))

  def executeClaim(userId: String, params: Map[String, String]): Either[HttpError, Json] = {
    val panelId = params.getOrElse("panelId", "")
    val slot = params.get("slot").flatMap(value => scala.util.Try(value.toInt).toOption).getOrElse(0)

    if (panelId.isEmpty || slot < 1 || slot > 7) {
      return Left(HttpError.badRequest("INVALID_CHECK_IN_PARAMS", "panelId and slot (1-7) are required"))
    }

    val progress = currentProgress(userId)
    val signedCount = progress.signedSlots.size
    val activeSlot =
      if (!progress.signedToday && signedCount < 7) signedCount + 1
      else -1

    if (slot != activeSlot) {
      return Left(HttpError.conflict("CHECK_IN_SLOT_NOT_READY", s"Slot $slot is not claimable right now"))
    }

    val rewards = InMemoryStore.checkInPanelRewards
      .getOrElse(panelId, Vector.empty)
      .lift(slot - 1)
      .getOrElse(CheckInSlotReward())

    val wallet = currentWallet(userId)
    InMemoryStore.playerWallets = InMemoryStore.playerWallets.updated(
      userId,
      wallet.copy(
        coins = wallet.coins + rewards.coins,
        gems = wallet.gems + rewards.gems,
        fragments = wallet.fragments + rewards.fragments
      )
    )

    InMemoryStore.playerWeeklyCheckIn = InMemoryStore.playerWeeklyCheckIn.updated(
      userId,
      progress.copy(
        signedSlots = progress.signedSlots + slot,
        signedToday = true
      )
    )

    Right(buildPayload(userId, Some(panelId)))
  }

  def registerPanelRewards(panelId: String, slots: Vector[CheckInSlotReward]): Unit =
    InMemoryStore.checkInPanelRewards = InMemoryStore.checkInPanelRewards.updated(panelId, slots)

  private def buildPayload(userId: String, panelId: Option[String]): Json = {
    val progress = currentProgress(userId)
    val signedCount = progress.signedSlots.size
    val activeSlot =
      if (!progress.signedToday && signedCount < 7) signedCount + 1
      else -1
    val wallet = currentWallet(userId)
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

  private def currentWallet(userId: String): PlayerWallet =
    InMemoryStore.playerWallets.getOrElse(userId, PlayerWallet(coins = 1280, gems = 96, fragments = 0))

  private def currentProgress(userId: String): WeeklyCheckInProgress = {
    val weekKey = currentWeekKey()
    val stored = InMemoryStore.playerWeeklyCheckIn.getOrElse(userId, WeeklyCheckInProgress(weekKey = weekKey))
    if (stored.weekKey != weekKey) WeeklyCheckInProgress(weekKey = weekKey)
    else stored
  }

  private def currentWeekKey(): String = {
    val today = LocalDate.now(ZoneOffset.UTC)
    val weekStart = today.`with`(DayOfWeek.MONDAY)
    weekStart.toString
  }
}
