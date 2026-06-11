package microservice.bird.tables.shared

import microservice.bird.objects.{BirdDesign, BirdSubmission}
import io.circe.parser._
import io.circe.syntax._

/** 鸟类模块 Row ↔ 领域对象映射，以及 JSON 字符串列表编解码。
  *
  * 关联：BirdDesignTable / BirdSubmissionTable 的 tierSkills、mechanismTags 以 JSON 存库。
  */
object BirdRowMapper {
  /** BirdDesignRow → BirdDesign 领域对象，解码 tierSkills 与 mechanismTags JSON。 */
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

  /** BirdSubmissionRow → BirdSubmission 领域对象。 */
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

  /** 将字符串列表序列化为紧凑 JSON，写入 tier_skills_json / mechanism_tags_json 列。 */
  def encodeStringList(values: List[String]): String =
    values.asJson.noSpaces

  private def decodeStringList(raw: String): List[String] =
    parse(raw).flatMap(_.as[List[String]]) match {
      case Right(values) => values
      case Left(_) => List.empty
    }
}
