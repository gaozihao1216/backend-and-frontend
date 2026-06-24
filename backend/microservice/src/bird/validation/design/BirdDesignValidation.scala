package microservice.bird.validation.design

import microservice.bird.objects.design.BirdDesignInput
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError

/** 鸟类设计字段校验：trim 字符串、stats 范围 1–200、tierSkills 必须恰好 3 条。 */
private[bird] object BirdDesignValidation {
  /** 校验并规范化 BirdDesignInput，返回 trim 后的 body。 */
  def validate(body: BirdDesignInput): Step[BirdDesignInput] = {
    val trimmedName = body.name.trim
    val trimmedSummary = body.summary.trim
    val trimmedSkillName = body.skillName.trim
    val tierSkills = body.tierSkills.map(_.trim).filter(_.nonEmpty)
    val mechanismTags = body.mechanismTags.map(_.trim).filter(_.nonEmpty)

    if (trimmedName.length < 2) {
      PlanStep.fail(HttpError.badRequest("INVALID_BIRD_NAME", "Bird name must be at least 2 characters"))
    } else if (trimmedSummary.length < 6) {
      PlanStep.fail(HttpError.badRequest("INVALID_BIRD_SUMMARY", "Summary must be at least 6 characters"))
    } else if (trimmedSkillName.length < 2) {
      PlanStep.fail(HttpError.badRequest("INVALID_BIRD_SKILL", "Skill name must be at least 2 characters"))
    } else if (body.attack < 1 || body.attack > 200 || body.impact < 1 || body.impact > 200 || body.speed < 1 || body.speed > 200) {
      PlanStep.fail(HttpError.badRequest("INVALID_BIRD_STATS", "Stats must be integers between 1 and 200"))
    } else if (tierSkills.length != 3) {
      PlanStep.fail(HttpError.badRequest("INVALID_BIRD_TIER_SKILLS", "Exactly 3 tier skill descriptions are required"))
    } else {
      PlanStep.succeed(
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

  /** 同步校验鸟类设计输入字段。 */
  def check(body: BirdDesignInput): Either[HttpError, BirdDesignInput] = {
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
