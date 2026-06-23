package microservice.admin.support.mapping

import io.circe.syntax._
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment
import microservice.admin.objects.level._
import microservice.admin.objects.submission.ReviewedSubmission
import microservice.level.objects.core.Level
import microservice.level.objects.inventory.BirdPool
import microservice.level.objects.slot.SlotAssignment
import microservice.level.objects.social.LevelComment
import microservice.level.objects.submission.{Submission, SubmissionWithLevel}

/** level 模块 handoff → admin DTO（仅 support 层引用 level 类型）。 */
object LevelHandoffMapping {
  def toLevelComment(comment: LevelComment): AdminLevelComment =
    AdminLevelComment(
      id = comment.id,
      levelId = comment.levelId,
      userId = comment.userId,
      content = comment.content,
      createdAt = comment.createdAt
    )

  def toLevelSnapshot(level: Level): AdminLevelSnapshot =
    AdminLevelSnapshot(
      id = level.id,
      title = level.title,
      description = level.description,
      tags = level.tags,
      data = level.data.asJson,
      authorId = level.authorId,
      status = level.status,
      rejectionReason = level.rejectionReason,
      averageRating = level.averageRating,
      ratingCount = level.ratingCount,
      createdAt = level.createdAt,
      updatedAt = level.updatedAt,
      publishedAt = level.publishedAt
    )

  def toSubmissionWithLevel(value: SubmissionWithLevel): AdminSubmissionWithLevel =
    AdminSubmissionWithLevel(
      id = value.id,
      levelId = value.levelId,
      submitterId = value.submitterId,
      status = value.status,
      reviewerId = value.reviewerId,
      reviewNote = value.reviewNote,
      submittedAt = value.submittedAt,
      reviewedAt = value.reviewedAt,
      level = toLevelSnapshot(value.level)
    )

  def toSlotAssignment(slot: SlotAssignment): LevelSlotAssignment =
    LevelSlotAssignment(
      id = slot.id,
      levelSuffix = slot.levelSuffix,
      submissionId = slot.submissionId,
      sourceLevelId = slot.sourceLevelId,
      assignedById = slot.assignedById,
      assignedAt = slot.assignedAt,
      note = slot.note,
      birdPool = slot.birdPool.map(toAdminBirdPool)
    )

  def toReviewedSubmission(submission: Submission): ReviewedSubmission =
    ReviewedSubmission(
      id = submission.id,
      levelId = submission.levelId,
      submitterId = submission.submitterId,
      status = submission.status.value,
      reviewerId = submission.reviewerId,
      reviewNote = submission.reviewNote,
      submittedAt = submission.submittedAt,
      reviewedAt = submission.reviewedAt
    )

  def toAdminBirdPool(pool: BirdPool): AdminBirdPool =
    AdminBirdPool(
      totalBirds = pool.totalBirds,
      allowedBirdTypes = pool.allowedBirdTypes,
      caps = pool.caps
    )

  def toLevelBirdPool(pool: AdminBirdPool): BirdPool =
    BirdPool(
      totalBirds = pool.totalBirds,
      allowedBirdTypes = pool.allowedBirdTypes,
      caps = pool.caps
    )
}
