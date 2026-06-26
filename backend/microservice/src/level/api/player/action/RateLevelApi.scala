package microservice.level.api.player.action

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.support.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.social.{RateLevelErrors, Rating}
import microservice.level.tables.rating.{RatingTable}
import microservice.level.tables.shared.{RatingRow}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.enums.{LevelStatus, UserRole}
import microservice.level.objects.player.request.RateLevelRequest

/** 玩家对已发布关卡评分 APIMessage。 */
final case class RateLevelAPIMessage(
  playerId: String,
  levelId: String,
  body: RateLevelRequest
) extends APIWithTokenMessage[Rating] {
  override def token: String = playerId

  /** plan 定义了什么业务流程：Player 对已 Published 关卡评分 1–5，upsert Rating 并重算 Level 平均分。
    *
    * 解决了什么问题：玩家反馈需持久化且聚合到关卡列表的 averageRating。
    * 在事务内起到什么作用：RatingTable upsert + LevelTable.updateRatingStats 原子执行。
    * 关联的前端 API：POST /player/levels/:levelId/ratings；前端 `RateLevelApi`。
    */

  override def plan(connection: Connection): IO[Either[HttpError, Rating]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- PlanSteps.fromEither(AccessControl.requireRole(connection, playerId, UserRole.Player))
        // 步骤 2：确认关卡可评分且 score 在 1–5 范围内
        _ <- requireRateableLevel(connection).map(_ => ())
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

  private def requireRateableLevel(connection: Connection): cats.data.EitherT[IO, HttpError, LevelRow] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId))).flatMap {
      case None =>
        EitherT.leftT[IO, LevelRow](RateLevelErrors.LevelMissing(levelId).toHttpError)
      case Some(level) if level.status != LevelStatus.Published =>
        EitherT.leftT[IO, LevelRow](RateLevelErrors.LevelNotPublished(levelId).toHttpError)
      case Some(_) if body.score < 1 || body.score > 5 =>
        EitherT.leftT[IO, LevelRow](RateLevelErrors.InvalidScore(body.score).toHttpError)
      case Some(level) =>
        EitherT.rightT[IO, HttpError](level)
    }
}
