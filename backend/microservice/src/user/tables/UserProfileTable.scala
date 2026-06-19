package microservice.user.tables

/** 用户资料读模型投影行（预留，当前未接入 JDBC）。
  *
  * 定义：userId + 关卡/评论 id 列表 + 计数 的扁平 case class。
  * 问题：GetUserProfile 现于 APIMessage 内多表聚合，未来可下沉为单 SQL 视图。
  * 作用：占位类型，便于后续 profile 查询性能优化。
  * 关联：[[GetUserProfileAPIMessage]] 当前未使用；[[UserProfileTable]] 包级命名空间。
  */
final case class UserProfileProjectionRow(
  userId: String,
  publishedLevelIds: List[String],
  recentCommentIds: List[String],
  favoriteCount: Int,
  ratingCount: Int
)
