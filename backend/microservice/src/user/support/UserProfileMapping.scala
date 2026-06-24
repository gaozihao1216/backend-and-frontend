package microservice.user.support

import microservice.level.objects.user.{ProfileCommentSnapshot, ProfileLevelSnapshot}
import microservice.user.objects.profile.{UserProfileComment, UserProfilePublishedLevel}

/** user 模块内：level handoff DTO → 用户资料 API 响应 DTO。 */
private[user] object UserProfileMapping {
  def toPublishedLevel(snapshot: ProfileLevelSnapshot): UserProfilePublishedLevel =
    UserProfilePublishedLevel(
      id = snapshot.id,
      title = snapshot.title,
      description = snapshot.description,
      tags = snapshot.tags,
      data = snapshot.dataJson,
      authorId = snapshot.authorId,
      status = snapshot.status,
      rejectionReason = snapshot.rejectionReason,
      averageRating = snapshot.averageRating,
      ratingCount = snapshot.ratingCount,
      createdAt = snapshot.createdAt,
      updatedAt = snapshot.updatedAt,
      publishedAt = snapshot.publishedAt
    )

  def toComment(snapshot: ProfileCommentSnapshot): UserProfileComment =
    UserProfileComment(
      id = snapshot.id,
      levelId = snapshot.levelId,
      userId = snapshot.userId,
      content = snapshot.content,
      createdAt = snapshot.createdAt
    )
}
