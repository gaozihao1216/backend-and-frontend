package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{CheckInSlotReward, PlayerPreparationJson}
import microservice.player.support.preparation.{PlayerPreparationAccess, PlayerPreparationSupport}
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.support.AccessControl

/** 备战状态 APIMessage。
  *
  * 定义：返回鸟/弹弓升级视图 + 钱包余额 JSON。
  * 问题：准备页需合并 Catalog 静态配置与玩家升级表行。
  * 作用：requireRole → getOrCreate 钱包 → PlayerPreparationSupport.buildResponse。
  * 关联：[[microservice.player.routes.PlayerApiMessages]] 注册；[[PlayerPreparationSupport]]。
  */
final case class GetPreparationStateAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 获取备战状态（鸟/弹弓升级 + 钱包余额）。
    *
    * 关联的前端 API：`GetPreparationStateApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：获取或创建玩家钱包记录
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        catalog <- PlayerPreparationAccess.requireCatalog(connection)
        skillConfigs <- PlayerPreparationAccess.requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, wallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }
}
