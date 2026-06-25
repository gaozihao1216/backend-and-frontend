package microservice.player.support.ui

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import java.time.{DayOfWeek, LocalDate, ZoneOffset}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.checkin.{CheckInSlotReward, WeeklyCheckInProgress}
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable
import microservice.player.tables.progress.legacy_check_in.PlayerLegacyCheckInTable
import microservice.player.tables.progress.level_progress.PlayerLevelProgressTable
import microservice.player.tables.shop.ShopTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.player.tables.weekly_check_in.PlayerWeeklyCheckInTable
import microservice.player.support.checkin.PlayerCheckInDefaults

/** 动态 UI data/action 分派与 legacy 签到辅助。
  *
  * 按 apiKey 路由到各 Player*Service；未知 key 返回 404。
  */
private[player] object PlayerUiRuntimeSupport {
  private val LegacyCheckInDataKey = "player.checkIn"
  private val LegacyCheckInClaimActionKey = "player.checkIn.claim"
  private val LevelProgressDataKey = "player.levelProgress"
  private val WalletDataKey = "player.wallet"
  private val ShopDataKey = "player.shop"
  private val ShopPurchaseActionKey = "player.shop.purchase"
  private val WeeklyCheckInDataKey = "player.weeklyCheckIn"
  private val WeeklyCheckInClaimActionKey = "player.weeklyCheckIn.claim"

  private val LevelSuffixes = Vector(
    "level01", "level02", "level03", "level04", "level05",
    "level06", "level07", "level08", "level09", "level10"
  )

  /** 分派 UI data 请求并返回 JSON 载荷。 */
  def requireData(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Step[Json] =
    apiKey match {
      case WeeklyCheckInDataKey =>
        PlanStep.succeed(buildWeeklyCheckInPayload(connection, userId, panelId = None))
      case LevelProgressDataKey =>
        requireLevelProgressData(connection, userId)
      case WalletDataKey =>
        requireWalletData(connection, userId)
      case ShopDataKey =>
        requireShopData(connection, userId, params)
      case LegacyCheckInDataKey =>
        PlanStep.succeed(Json.obj("status" -> Json.fromString(PlayerLegacyCheckInTable.getStatus(connection, userId))))
      case other =>
        PlanStep.fail(HttpError.notFound("UNKNOWN_UI_DATA_KEY", s"Unknown ui data key: $other"))
    }

  /** 分派 UI action 请求并返回 JSON 结果。 */
  def requireAction(connection: Connection, userId: String, apiKey: String, params: Map[String, String]): Step[Json] =
    apiKey match {
      case WeeklyCheckInClaimActionKey =>
        requireWeeklyCheckInClaim(connection, userId, params)
      case ShopPurchaseActionKey =>
        requireShopPurchase(connection, userId, params)
      case LegacyCheckInClaimActionKey =>
        PlayerLegacyCheckInTable.getStatus(connection, userId) match {
          case "ready" =>
            PlanStep.succeed(
              Json.obj(
                "status" -> Json.fromString(PlayerLegacyCheckInTable.setStatus(connection, userId, "claimed"))
              )
            )
          case status =>
            PlanStep.fail(HttpError.conflict("CHECK_IN_NOT_READY", s"Cannot claim check-in reward while status is $status"))
        }
      case other =>
        PlanStep.fail(HttpError.notFound("UNKNOWN_UI_ACTION_KEY", s"Unknown ui action key: $other"))
    }

  private def requireLevelProgressData(connection: Connection, userId: String): Step[Json] =
    PlanStep.liftF(IO {
      val clearedLevels = PlayerLevelProgressTable.listClearedSuffixes(connection, userId)
      val levelStatuses = LevelSuffixes.map { suffix =>
        suffix -> Json.fromString(resolveLevelStatus(clearedLevels, suffix))
      }.toMap

      Json.obj(
        "levels" -> Json.obj(levelStatuses.toSeq: _*),
        "clearedCount" -> Json.fromInt(clearedLevels.size)
      )
    })

  private def requireWalletData(connection: Connection, userId: String): Step[Json] =
    PlanStep.liftF(IO {
      val wallet = PlayerWalletTable.getOrCreate(connection, userId)
      Json.obj(
        "coins" -> Json.fromInt(wallet.coins),
        "gems" -> Json.fromInt(wallet.gems),
        "fragments" -> Json.fromInt(wallet.fragments)
      )
    })

  private def requireShopData(connection: Connection, userId: String, params: Map[String, String]): Step[Json] = {
    val catalogIndex = params.get("catalogIndex").flatMap(value => scala.util.Try(value.toInt).toOption).getOrElse(0)
    PlanStep.liftF(IO(buildShopPayload(connection, userId, catalogIndex)))
  }

  private def requireShopPurchase(connection: Connection, userId: String, params: Map[String, String]): Step[Json] = {
    val itemId = params.getOrElse("itemId", "").trim
    val catalogIndex = params.get("catalogIndex").flatMap(value => scala.util.Try(value.toInt).toOption).getOrElse(0)

    if (itemId.isEmpty) {
      PlanStep.fail(HttpError.badRequest("INVALID_SHOP_ITEM", "itemId is required"))
    } else {
      ShopTable.findItemById(connection, itemId).filter(_.active) match {
        case None =>
          PlanStep.fail(HttpError.notFound("SHOP_ITEM_NOT_FOUND", s"Shop item not found: $itemId"))
        case Some(item) =>
          val wallet = PlayerWalletTable.getOrCreate(connection, userId)
          val hasBalance =
            item.currency match {
              case "coins" => wallet.coins >= item.price
              case "gems"  => wallet.gems >= item.price
              case _       => false
            }

          if (!hasBalance) {
            PlanStep.fail(HttpError.conflict("INSUFFICIENT_BALANCE", s"Not enough ${item.currency} to buy ${item.name}"))
          } else {
            val updatedWallet =
              item.currency match {
                case "coins" => wallet.copy(coins = wallet.coins - item.price)
                case "gems"  => wallet.copy(gems = wallet.gems - item.price)
                case _       => wallet
              }

            PlayerWalletTable.save(connection, userId, updatedWallet)
            ShopTable.recordPurchase(connection, userId, item)
            PlanStep.succeed(buildShopPayload(connection, userId, catalogIndex))
          }
      }
    }
  }

  private def buildShopPayload(connection: Connection, userId: String, catalogIndex: Int): Json = {
    val wallet = PlayerWalletTable.getOrCreate(connection, userId)
    val items = ShopTable
      .listActiveItems(connection)
      .filter(_.catalogIndex == catalogIndex)
      .map { item =>
        Json.obj(
          "id" -> Json.fromString(item.id),
          "name" -> Json.fromString(item.name),
          "description" -> Json.fromString(item.description),
          "price" -> Json.fromInt(item.price),
          "currency" -> Json.fromString(item.currency)
        )
      }
    val purchases = ShopTable.listPurchasesByUser(connection, userId).map(_.itemId)

    Json.obj(
      "catalogIndex" -> Json.fromInt(catalogIndex),
      "wallet" -> Json.obj(
        "coins" -> Json.fromInt(wallet.coins),
        "gems" -> Json.fromInt(wallet.gems),
        "fragments" -> Json.fromInt(wallet.fragments)
      ),
      "items" -> Json.arr(items: _*),
      "purchases" -> Json.arr(purchases.map(Json.fromString): _*)
    )
  }

  private def requireWeeklyCheckInClaim(
    connection: Connection,
    userId: String,
    params: Map[String, String]
  ): Step[Json] = {
    val panelId = params.getOrElse("panelId", PlayerCheckInDefaults.roleHomeCheckInPanelId)
    val slot = params.get("slot").flatMap(value => scala.util.Try(value.toInt).toOption).getOrElse(0)

    if (panelId.isEmpty || slot < 1 || slot > 7) {
      PlanStep.fail(HttpError.badRequest("INVALID_CHECK_IN_PARAMS", "panelId and slot (1-7) are required"))
    } else {
      val weekKey = currentWeekKey()
      val progress = currentProgress(connection, userId, weekKey)
      val signedCount = progress.signedSlots.size
      val activeSlot =
        if (!progress.signedToday && signedCount < 7) signedCount + 1
        else -1

      if (slot != activeSlot) {
        PlanStep.fail(HttpError.conflict("CHECK_IN_SLOT_NOT_READY", s"Slot $slot is not claimable right now"))
      } else {
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

        PlanStep.succeed(buildWeeklyCheckInPayload(connection, userId, Some(panelId)))
      }
    }
  }

  private def buildWeeklyCheckInPayload(connection: Connection, userId: String, panelId: Option[String]): Json = {
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

  private def resolveLevelStatus(clearedLevels: Set[String], suffix: String): String =
    if (clearedLevels.contains(suffix)) {
      "cleared"
    } else if (isLevelUnlocked(clearedLevels, suffix)) {
      "notCleared"
    } else {
      "locked"
    }

  private def isLevelUnlocked(clearedLevels: Set[String], suffix: String): Boolean = {
    val index = LevelSuffixes.indexOf(suffix)
    if (index <= 0) {
      true
    } else {
      clearedLevels.contains(LevelSuffixes(index - 1))
    }
  }
}
