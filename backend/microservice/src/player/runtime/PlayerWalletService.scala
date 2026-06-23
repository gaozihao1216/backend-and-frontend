package microservice.player.runtime

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.player.tables.wallet.PlayerWalletTable

/** 玩家钱包 UI 数据服务。
  *
  * 定义：dataApiKey + getData 返回金币/道具/鸟蛋 JSON。
  * 问题：动态 UI 通过 apiKey 拉钱包，不应各 APIMessage 重复组装 JSON。
  * 作用：getOrCreate 钱包 → Circe Json 字段映射。
  * 关联：[[GetPlayerUiDataAPIMessage]] data 分派；[[PlayerWalletTable]]。
  */
object PlayerWalletService {
  /** 前端 dataSource.apiKey 使用的标识。 */
  val dataApiKey: String = "player.wallet"

  /** 读取或创建用户钱包并序列化为 JSON。 */
  def requireData(connection: Connection, userId: String): Step[Json] =
    PlanStep.liftF(IO(buildPayload(connection, userId)))

  /** 读取钱包并序列化为 coins/gems/fragments 字段。 */
  private def buildPayload(connection: Connection, userId: String): Json = {
    val wallet = PlayerWalletTable.getOrCreate(connection, userId)
    Json.obj(
      "coins" -> Json.fromInt(wallet.coins),
      "gems" -> Json.fromInt(wallet.gems),
      "fragments" -> Json.fromInt(wallet.fragments)
    )
  }
}
