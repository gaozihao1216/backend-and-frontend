package microservice.infrastructure.database

import microservice.auth.tables.UserRow
import microservice.level.objects.Favorite
import microservice.level.tables.{CommentRow, LevelRow, RatingRow, SubmissionRow}

object InMemoryStore {
  var users: Vector[UserRow] = Vector.empty
  var levels: Vector[LevelRow] = Vector.empty
  var ratings: Vector[RatingRow] = Vector.empty
  var comments: Vector[CommentRow] = Vector.empty
  var favorites: Vector[Favorite] = Vector.empty
  var submissions: Vector[SubmissionRow] = Vector.empty

  def reset(
    nextUsers: Vector[UserRow],
    nextLevels: Vector[LevelRow],
    nextRatings: Vector[RatingRow],
    nextComments: Vector[CommentRow],
    nextFavorites: Vector[Favorite],
    nextSubmissions: Vector[SubmissionRow]
  ): Unit = {
    users = nextUsers
    levels = nextLevels
    ratings = nextRatings
    comments = nextComments
    favorites = nextFavorites
    submissions = nextSubmissions
  }
}
