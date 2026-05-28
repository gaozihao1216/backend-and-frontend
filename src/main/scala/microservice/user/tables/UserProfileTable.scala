package microservice.user.tables

final case class UserProfileProjectionRow(
  userId: String,
  publishedLevelIds: List[String],
  recentCommentIds: List[String],
  favoriteCount: Int,
  ratingCount: Int
)
