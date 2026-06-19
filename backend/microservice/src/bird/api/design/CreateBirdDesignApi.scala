package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.design.BirdDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdDesignRow, BirdRowMapper}
import microservice.bird.validation.design.BirdDesignValidation
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}

/** 设计师创建新鸟类设计，初始状态为 Draft。
  *
  * 实现：requireRole(Designer) → BirdDesignValidation.validate → BirdDesignTable.insert。
  * 关联：POST /designer/bird-designs；previewImageUrl 缺省时使用 BirdDesignTable.defaultPreviewImageUrl。
  */
final case class CreateBirdDesignAPIMessage(designerId: String, body: CreateBirdDesignBody)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        input <- PlanSteps.require(BirdDesignValidation.validate(toInput(body)))
        design <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val row = BirdDesignTable.insert(
            connection,
            BirdDesignRow(
              id = BirdDesignTable.nextId(connection),
              authorId = designerId,
              name = input.name,
              summary = input.summary,
              skillName = input.skillName,
              attack = input.attack,
              impact = input.impact,
              speed = input.speed,
              tierSkillsJson = BirdRowMapper.encodeStringList(input.tierSkills),
              previewImageUrl = input.previewImageUrl.filter(_.trim.nonEmpty).map(_.trim).getOrElse(BirdDesignTable.defaultPreviewImageUrl),
              mechanismTagsJson = BirdRowMapper.encodeStringList(input.mechanismTags),
              status = LevelStatus.Draft,
              rejectionReason = None,
              createdAt = timestamp,
              updatedAt = timestamp,
              publishedAt = None
            )
          )
          BirdRowMapper.toBirdDesign(row)
        }
      } yield design
    }

  private def toInput(body: CreateBirdDesignBody): BirdDesignInputBody =
    BirdDesignInputBody(
      name = body.name,
      summary = body.summary,
      skillName = body.skillName,
      attack = body.attack,
      impact = body.impact,
      speed = body.speed,
      tierSkills = body.tierSkills,
      previewImageUrl = body.previewImageUrl,
      mechanismTags = body.mechanismTags
    )
}
