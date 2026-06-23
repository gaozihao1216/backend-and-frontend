package microservice.level.routes

import io.circe.generic.auto._
import microservice.infrastructure.api.RegisteredAPIMessage
import microservice.infrastructure.api.RegisteredAPIMessage.protectedApi
import microservice.level.api.design.{CreateLevelAPIMessage, SubmitLevelAPIMessage}
import microservice.level.api.player.action.{
  CreateCommentAPIMessage,
  FavoriteLevelAPIMessage,
  RateLevelAPIMessage,
  UnfavoriteLevelAPIMessage
}
import microservice.level.api.player.read.{
  GetFavoriteLevelsAPIMessage,
  GetLevelCommentsAPIMessage,
  GetPublishedLevelAPIMessage,
  GetPublishedLevelsAPIMessage
}
import microservice.level.objects.core.Level
import microservice.level.objects.social.{Favorite, FavoriteWithLevel, LevelComment, Rating}
import microservice.level.objects.submission.Submission
import org.http4s.Status

object LevelApiMessages {
  val apiMessages: List[RegisteredAPIMessage] = List(
    protectedApi[CreateLevelAPIMessage, Level](
      successStatus = Status.Created,
      identityFields = List("designerId")
    ),
    protectedApi[SubmitLevelAPIMessage, Submission](
      successStatus = Status.Created,
      identityFields = List("designerId")
    ),
    protectedApi[GetPublishedLevelsAPIMessage, List[Level]](identityFields = List("playerId")),
    protectedApi[GetPublishedLevelAPIMessage, Level](identityFields = List("playerId")),
    protectedApi[GetLevelCommentsAPIMessage, List[LevelComment]](identityFields = List("playerId")),
    protectedApi[GetFavoriteLevelsAPIMessage, List[FavoriteWithLevel]](identityFields = List("playerId")),
    protectedApi[CreateCommentAPIMessage, LevelComment](
      successStatus = Status.Created,
      identityFields = List("playerId")
    ),
    protectedApi[FavoriteLevelAPIMessage, Favorite](
      successStatus = Status.Created,
      identityFields = List("playerId")
    ),
    protectedApi[UnfavoriteLevelAPIMessage, Favorite](identityFields = List("playerId")),
    protectedApi[RateLevelAPIMessage, Rating](
      successStatus = Status.Created,
      identityFields = List("playerId")
    )
  )
}
