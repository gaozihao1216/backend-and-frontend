package microservice.level.api.player.action

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.social.Rating
import microservice.level.tables.rating.{RatingTable}
import microservice.level.tables.shared.{RatingRow}
import microservice.level.tables.level.{LevelTable}
import microservice.level.support.player.LevelApiSupport
import microservice.system.objects.UserRole
import microservice.level.body.player.RateLevelBody

/** 玩家对已发布关卡评分 APIMessage。 */
final case class RateLevelAPIMessage(
  playerId: String,
  levelId: String,
  body: RateLevelBody
) extends APIWithTokenMessage[Rating] {
  override def token: String = playerId

  /** plan 定义了什么业务流程：Player 对已 Published 关卡评分 1–5，upsert Rating 并重算 Level 平均分。
    *
    * 解决了什么问题：玩家反馈需持久化且聚合到关卡列表的 averageRating。
    * 在事务内起到什么作用：RatingTable upsert + LevelTable.updateRatingStats 原子执行。
    * 关联的 HTTP 路由/前端 API：POST /player/levels/:levelId/ratings；前端 `RateLevelApi`。
    */

  override def plan(connection: Connection): IO[Either[HttpError, Rating]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ())
        // 步骤 2：确认关卡可评分且 score 在 1–5 范围内
        _ <- LevelApiSupport.requireRateableLevel(connection, levelId, body.score).map(_ => ())
        // 步骤 3：upsert Rating 并重算 Level 平均分与评分人数
        rating <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val ratingRow =
            RatingTable.findByLevelAndPlayer(connection, levelId, playerId) match {
              case Some(existing) =>
                RatingTable.updateScore(connection, existing.id, body.score, timestamp).getOrElse(existing)
              case None =>
                RatingTable.insert(
                  connection,
                  RatingRow(
                    id = RatingTable.nextId(connection),
                    levelId = levelId,
                    playerId = playerId,
                    score = body.score,
                    createdAt = timestamp,
                    updatedAt = timestamp
                  )
                )
            }

          val levelRatings = RatingTable.listByLevel(connection, levelId)
          val average =
            if (levelRatings.isEmpty) 0.0
            else BigDecimal(levelRatings.map(_.score).sum.toDouble / levelRatings.size).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble
          LevelTable.updateRatingStats(connection, levelId, average, levelRatings.size, timestamp)

          LevelRowMapper.toRating(ratingRow)
        }
      } yield rating
    }
}
