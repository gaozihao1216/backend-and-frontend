package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.bird.api.internal.player.{
  GetBirdSkillConfigMapInternalAPIMessage,
  ListPublishedBirdCatalogEntriesInternalAPIMessage,
  ListSystemBirdCatalogEntriesInternalAPIMessage
}
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.preparation.{BirdSkillConfigView, PlayerPreparationJson}
import microservice.player.support.catalog.PreparationCatalogMapping
import microservice.player.support.preparation.{BirdCatalogEntry, PlayerPreparationCatalog, PlayerPreparationSupport}
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.enums.UserRole
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
        catalog <- requireCatalog(connection)
        skillConfigs <- requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, wallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }

  /** 合并系统鸟与已发布玩家鸟，形成准备页可展示的完整鸟目录。 */
  private def requireCatalog(connection: Connection): microservice.infrastructure.api.PlanStep.Step[Vector[BirdCatalogEntry]] =
    for {
      system <- PlanSteps.runApi(ListSystemBirdCatalogEntriesInternalAPIMessage(), connection)
      published <- PlanSteps.runApi(ListPublishedBirdCatalogEntriesInternalAPIMessage(), connection)
    } yield PlayerPreparationCatalog.merge(
      system.map(PreparationCatalogMapping.toSystemSnapshot),
      published.map(PreparationCatalogMapping.toPublishedSnapshot)
    )

  /** 读取鸟技能配置，并转换成准备页响应中使用的轻量视图。 */
  private def requireSkillConfigMap(
    connection: Connection
  ): microservice.infrastructure.api.PlanStep.Step[Map[String, BirdSkillConfigView]] =
    PlanSteps
      .runApi(GetBirdSkillConfigMapInternalAPIMessage(), connection)
      .map(_.view.mapValues(PreparationCatalogMapping.toSkillConfigView).toMap)
}
