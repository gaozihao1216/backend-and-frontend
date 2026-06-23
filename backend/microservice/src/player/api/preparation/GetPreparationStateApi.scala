package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{CheckInSlotReward, PlayerPreparationJson}
import microservice.player.preparation.PlayerPreparationSupport
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** GET /player/preparation 备战状态 APIMessage。
  *
  * 定义：返回鸟/弹弓升级视图 + 钱包余额 JSON。
  * 问题：准备页需合并 Catalog 静态配置与玩家升级表行。
  * 作用：requireRole → getOrCreate 钱包 → PlayerPreparationSupport.buildResponse。
  * 关联：[[PlayerPreparationRouter]] GET；[[PlayerPreparationSupport]]。
  */
final case class GetPreparationStateAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, wallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
