package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.support.preparation.{PlayerPreparationAccess, PlayerPreparationSupport}
import microservice.player.objects.preparation.PlayerPreparationJson
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.enums.UserRole
import microservice.user.support.AccessControl

/** POST .../slingshot/upgrade 弹弓升级 APIMessage。 */
final case class UpgradePreparationSlingshotAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 消耗金币升级弹弓等级。
    *
    * 关联的前端 API：POST /player/preparation/slingshot/upgrade；前端 `UpgradePreparationSlingshotApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：获取或创建玩家钱包
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        // 步骤 3：读取当前弹弓等级
        currentLevel <- PlanSteps.read(PlayerPreparationTable.getSlingshotLevel(connection, userId))
        // 步骤 4：确认未达最高等级
        _ <- PlayerPreparationAccess.requireSlingshotBelowMaxLevel(currentLevel)
        cost = PlayerPreparationTable.upgradeCost(currentLevel)
        // 步骤 5：确认钱包金币足够支付升级费用
        _ <- PlayerPreparationAccess.requireCoins(wallet, cost)
        // 步骤 6：执行弹弓等级 +1
        _ <- PlayerPreparationAccess.requireUpgradeSlingshot(connection, userId)
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        // 步骤 7：扣减金币并持久化钱包
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        catalog <- PlayerPreparationAccess.requireCatalog(connection)
        skillConfigs <- PlayerPreparationAccess.requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }
}
