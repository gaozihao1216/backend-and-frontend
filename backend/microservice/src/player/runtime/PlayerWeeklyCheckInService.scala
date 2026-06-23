package microservice.player.runtime

import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import java.time.{DayOfWeek, LocalDate, ZoneOffset}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{CheckInSlotReward, WeeklyCheckInProgress}
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.player.tables.weekly_check_in.PlayerWeeklyCheckInTable

/** 周签到 UI 数据与领取动作服务。
  *
  * 定义：7 日签到进度 + claimActionKey 领取当日奖励。
  * 问题：签到面板奖励由 CheckInPanelRewardTable 配置，进度存 WeeklyCheckInTable。
  * 作用：getData 合并 panel 配置与玩家进度；executeClaim 发奖入 wallet。
  * 关联：[[PlayerWeeklyCheckInTable]]；[[CheckInPanelRewardTable]]。
  */
object PlayerWeeklyCheckInService {
  private val WeeklyCheckInDataKey = "player.weeklyCheckIn"
  private val WeeklyCheckInClaimActionKey = "player.weeklyCheckIn.claim"

  /** 拉取签到面板状态的 dataSource apiKey。 */
  val dataApiKey: String = WeeklyCheckInDataKey

  /** 领取当日签到奖励的 action apiKey。 */
  val claimActionKey: String = WeeklyCheckInClaimActionKey

  /** 返回默认面板（无 panelId）的周签到 payload。 */
  def requireData(connection: Connection, userId: String): Step[Json] =
    PlanStep.fromEither(getData(connection, userId))

  def getData(connection: Connection, userId: String): Either[HttpError, Json] =
    Right(buildPayload(connection, userId, panelId = None))

  /** 返回指定 panelId 的周签到 payload（含该面板奖励配置）。 */
  def getDataForPanel(connection: Connection, userId: String, panelId: String): Either[HttpError, Json] =
    Right(buildPayload(connection, userId, Some(panelId)))

  /** 领取指定 slot（1-7）的签到奖励：校验 activeSlot、发放钱包奖励并标记今日已签。 */
  def requireExecuteClaim(connection: Connection, userId: String, params: Map[String, String]): Step[Json] =
    PlanStep.fromEither(executeClaim(connection, userId, params))

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

  /** 总监注册签到面板的 7 格奖励配置（覆盖写入 CheckInPanelRewardTable）。 */
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
