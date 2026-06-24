package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.support.preparation.{PlayerPreparationAccess, PlayerPreparationSupport}
import microservice.player.objects.PlayerPreparationJson
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.support.AccessControl

/** POST .../birds/:birdType/upgrade 鸟升级 APIMessage。 */
final case class UpgradePreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 消耗金币升级指定鸟种的等级。
    *
    * 关联的前端 API：POST /player/preparation/birds/:birdType/upgrade；前端 `UpgradePreparationBirdApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：从 Catalog 加载鸟种信息
        entry <- PlayerPreparationAccess.requireCatalogEntry(connection, birdType)
        // 步骤 3：确保玩家鸟种升级记录存在（初始化默认值）
        _ <- PlanSteps.read(PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType)))
        // 步骤 4：获取或创建玩家钱包
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        // 步骤 5：读取当前鸟种等级
        currentLevel <- PlanSteps.read(PlayerPreparationTable.listBirdLevels(connection, userId).getOrElse(birdType, 1))
        // 步骤 6：确认未达最高等级
        _ <- PlayerPreparationAccess.requireBirdBelowMaxLevel(currentLevel)
        cost = PlayerPreparationTable.upgradeCost(currentLevel)
        // 步骤 7：确认钱包金币足够支付升级费用
        _ <- PlayerPreparationAccess.requireCoins(wallet, cost)
        // 步骤 8：执行鸟种等级 +1
        _ <- PlayerPreparationAccess.requireUpgradeBird(connection, userId, birdType)
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        // 步骤 9：扣减金币并持久化钱包
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        catalog <- PlayerPreparationAccess.requireCatalog(connection)
        skillConfigs <- PlayerPreparationAccess.requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }
}
