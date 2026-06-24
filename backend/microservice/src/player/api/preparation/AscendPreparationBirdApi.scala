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

/** POST .../birds/:birdType/ascend 鸟升阶 APIMessage。 */
final case class AscendPreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 消耗碎片升阶指定鸟种。
    *
    * 关联的前端 API：POST /player/preparation/birds/:birdType/ascend；前端 `AscendPreparationBirdApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：从 Catalog 加载鸟种信息
        entry <- PlayerPreparationAccess.requireCatalogEntry(connection, birdType)
        // 步骤 3：确保玩家鸟种升阶记录存在（初始化默认值）
        _ <- PlanSteps.read(PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType)))
        // 步骤 4：获取或创建玩家钱包
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        // 步骤 5：读取当前鸟种阶位
        currentTier <- PlanSteps.read(PlayerPreparationTable.listBirdTiers(connection, userId).getOrElse(birdType, 1))
        // 步骤 6：确认未达最高阶位
        _ <- PlayerPreparationAccess.requireBirdBelowMaxTier(currentTier)
        cost = PlayerPreparationTable.ascendCost(currentTier)
        // 步骤 7：确认钱包碎片足够支付升阶费用
        _ <- PlayerPreparationAccess.requireFragments(wallet, cost)
        // 步骤 8：执行鸟种阶位 +1
        _ <- PlayerPreparationAccess.requireAscendBird(connection, userId, birdType)
        updatedWallet = wallet.copy(fragments = wallet.fragments - cost)
        // 步骤 9：扣减碎片并持久化钱包
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        catalog <- PlayerPreparationAccess.requireCatalog(connection)
        skillConfigs <- PlayerPreparationAccess.requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }
}
