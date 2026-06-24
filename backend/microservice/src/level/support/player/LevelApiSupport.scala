package microservice.level.support.player

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.{Favorite, RateLevelErrors}
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.LevelStatus

/** 玩家侧关卡 API 公共辅助：已发布关卡、评分与收藏删除的前置校验。
  *
  * 各 `require*` 返回 [[PlanStep.Step]]，供 APIMessage `for` 推导式直接嵌入。
  */
private[level] object LevelApiSupport {
  /** 校验关卡存在且状态为 Published。 */
  def requirePublishedLevel(connection: Connection, levelId: String): Step[LevelRow] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId))).flatMap {
      case Some(level) if level.status == LevelStatus.Published => EitherT.rightT(level)
      case Some(_) => EitherT.leftT(HttpError.notFound("LEVEL_NOT_FOUND", "Published level not found"))
      case None    => EitherT.leftT(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
    }

  /** 校验关卡可评分：已发布且 score 在 1–5 之间。 */
  def requireRateableLevel(connection: Connection, levelId: String, score: Int): Step[LevelRow] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId))).flatMap {
      case None =>
        EitherT.leftT(RateLevelErrors.LevelMissing(levelId).toHttpError)
      case Some(level) if level.status != LevelStatus.Published =>
        EitherT.leftT(RateLevelErrors.LevelNotPublished(levelId).toHttpError)
      case Some(level) if score < 1 || score > 5 =>
        EitherT.leftT(RateLevelErrors.InvalidScore(score).toHttpError)
      case Some(level) =>
        EitherT.rightT(level)
    }

  /** 删除玩家对关卡的收藏记录并返回被删 Favorite。 */
  def requireDeletedFavorite(connection: Connection, playerId: String, levelId: String): Step[Favorite] =
    EitherT.liftF(IO(FavoriteTable.delete(connection, playerId, levelId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
      case Some(favorite) =>
        EitherT.rightT(favorite)
    }
}
