package microservice.model

final case class User(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  createdAt: String,
  updatedAt: String
)

final case class UserProfileStats(
  favoriteCount: Int,
  ratingCount: Int
)

final case class UserProfile(
  user: User,
  publishedLevels: List[Level],
  recentComments: List[Comment],
  stats: UserProfileStats
)

final case class BoundBackendUser(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  createdAt: String,
  updatedAt: String
)
