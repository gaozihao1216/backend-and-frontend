package microservice.player.runtime

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.tables.shop.ShopTable
import microservice.player.tables.wallet.PlayerWalletTable

/** 玩家商店 UI 数据与购买动作服务。
  *
  * 定义：dataApiKey/getData 列表商品；purchaseActionKey/executePurchase 扣费入库。
  * 问题：商店页与购买按钮共用 ShopTable 与 wallet 扣费逻辑。
  * 作用：listItems + 玩家已购标记；purchase 校验库存与余额。
  * 关联：[[InvokePlayerUiActionAPIMessage]]；[[ShopTable]]。
  */
object PlayerShopService {
  /** 拉取商店目录与钱包余额的 dataSource apiKey。 */
  val dataApiKey: String = "player.shop"
  /** 购买商品的 action apiKey。 */
  val purchaseActionKey: String = "player.shop.purchase"

  /** 返回指定 catalogIndex 下的商品列表、钱包余额与已购 itemId 列表。 */
  def requireData(connection: Connection, userId: String, params: Map[String, String]): Step[Json] = {
    val catalogIndex = params.get("catalogIndex").flatMap(value => scala.util.Try(value.toInt).toOption).getOrElse(0)
    PlanStep.liftF(IO(buildPayload(connection, userId, catalogIndex)))
  }

  /** 购买商品：校验 itemId、余额，扣款并记录购买后返回最新商店 payload。 */
  def requireExecutePurchase(connection: Connection, userId: String, params: Map[String, String]): Step[Json] = {
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
              case "gems" => wallet.gems >= item.price
              case _ => false
            }

          if (!hasBalance) {
            PlanStep.fail(HttpError.conflict("INSUFFICIENT_BALANCE", s"Not enough ${item.currency} to buy ${item.name}"))
          } else {
            val updatedWallet =
              item.currency match {
                case "coins" => wallet.copy(coins = wallet.coins - item.price)
                case "gems" => wallet.copy(gems = wallet.gems - item.price)
                case _ => wallet
              }

            PlayerWalletTable.save(connection, userId, updatedWallet)
            ShopTable.recordPurchase(connection, userId, item)
            PlanStep.succeed(buildPayload(connection, userId, catalogIndex))
          }
      }
    }
  }

  /** 组装商店 UI JSON：指定 catalog 页商品、钱包与已购 id 列表。 */
  private def buildPayload(connection: Connection, userId: String, catalogIndex: Int): Json = {
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
}
