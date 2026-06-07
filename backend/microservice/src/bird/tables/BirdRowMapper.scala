package microservice.bird.tables

import microservice.bird.objects.{BirdDesign, BirdSubmission}
import io.circe.parser._
import io.circe.syntax._

object BirdRowMapper {
  def toBirdDesign(row: BirdDesignRow): BirdDesign =
    BirdDesign(
      id = row.id,
      authorId = row.authorId,
      name = row.name,
      summary = row.summary,
      skillName = row.skillName,
      attack = row.attack,
      impact = row.impact,
      speed = row.speed,
      tierSkills = decodeStringList(row.tierSkillsJson),
      previewImageUrl = row.previewImageUrl,
      mechanismTags = decodeStringList(row.mechanismTagsJson),
      status = row.status,
      rejectionReason = row.rejectionReason,
      createdAt = row.createdAt,
      updatedAt = row.updatedAt,
      publishedAt = row.publishedAt
    )

  def toBirdSubmission(row: BirdSubmissionRow): BirdSubmission =
    BirdSubmission(
      id = row.id,
      birdDesignId = row.birdDesignId,
      submitterId = row.submitterId,
      status = row.status,
      reviewerId = row.reviewerId,
      reviewNote = row.reviewNote,
      submittedAt = row.submittedAt,
      reviewedAt = row.reviewedAt
    )

  def encodeStringList(values: List[String]): String =
    values.asJson.noSpaces

  private def decodeStringList(raw: String): List[String] =
    parse(raw).flatMap(_.as[List[String]]) match {
      case Right(values) => values
      case Left(_) => List.empty
    }
}
