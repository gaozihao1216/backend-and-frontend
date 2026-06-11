package microservice.bird.api

import microservice.infrastructure.http.HttpError

/** 鸟类设计输入的统一结构，供 Create/Update 与 Validation 共用。 */
final case class BirdDesignInputBody(
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkills: List[String],
  previewImageUrl: Option[String],
  mechanismTags: List[String]
)

/** 鸟类设计字段校验：trim 字符串、stats 范围 1–200、tierSkills 必须恰好 3 条。
  *
  * 关联：CreateBirdDesignAPIMessage、UpdateBirdDesignAPIMessage 在写入前调用 validate。
  */
object BirdDesignValidation {
  def validate(body: BirdDesignInputBody): Either[HttpError, BirdDesignInputBody] = {
    val trimmedName = body.name.trim
    val trimmedSummary = body.summary.trim
    val trimmedSkillName = body.skillName.trim
    val tierSkills = body.tierSkills.map(_.trim).filter(_.nonEmpty)
    val mechanismTags = body.mechanismTags.map(_.trim).filter(_.nonEmpty)

    if (trimmedName.length < 2) {
      return Left(HttpError.badRequest("INVALID_BIRD_NAME", "Bird name must be at least 2 characters"))
    }
    if (trimmedSummary.length < 6) {
      return Left(HttpError.badRequest("INVALID_BIRD_SUMMARY", "Summary must be at least 6 characters"))
    }
    if (trimmedSkillName.length < 2) {
      return Left(HttpError.badRequest("INVALID_BIRD_SKILL", "Skill name must be at least 2 characters"))
    }
    if (body.attack < 1 || body.attack > 200 || body.impact < 1 || body.impact > 200 || body.speed < 1 || body.speed > 200) {
      return Left(HttpError.badRequest("INVALID_BIRD_STATS", "Stats must be integers between 1 and 200"))
    }
    if (tierSkills.length != 3) {
      return Left(HttpError.badRequest("INVALID_BIRD_TIER_SKILLS", "Exactly 3 tier skill descriptions are required"))
    }

    Right(
      body.copy(
        name = trimmedName,
        summary = trimmedSummary,
        skillName = trimmedSkillName,
        tierSkills = tierSkills,
        mechanismTags = mechanismTags
      )
    )
  }
}
