package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.BirdDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
import microservice.bird.validation.BirdDesignValidation
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}

/** 更新鸟类设计：仅作者可编辑 Draft/Rejected 状态的设计，保存后重置为 Draft。
  *
  * 实现：校验所有权与状态 → validate → BirdDesignTable.updateEditable。
  * 关联：PUT /designer/bird-designs/:designId。
  */
final case class UpdateBirdDesignAPIMessage(designerId: String, designId: String, body: UpdateBirdDesignBody)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        existing <- PlanSteps.require(
          BirdDesignTable.findById(connection, designId) match {
            case None =>
              Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
            case Some(row) if row.authorId != designerId =>
              Left(HttpError.forbidden("Cannot edit another designer's bird design"))
            case Some(row) if row.status != LevelStatus.Draft && row.status != LevelStatus.Rejected =>
              Left(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft or rejected designs can be edited"))
            case Some(row) =>
              Right(row)
          }
        )
        input <- PlanSteps.require(
          BirdDesignValidation.validate(
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
          )
        )
        design <- PlanSteps.require(
          {
            val timestamp = Instant.now().toString
            val updatedRow = existing.copy(
              name = input.name,
              summary = input.summary,
              skillName = input.skillName,
              attack = input.attack,
              impact = input.impact,
              speed = input.speed,
              tierSkillsJson = BirdRowMapper.encodeStringList(input.tierSkills),
              previewImageUrl = input.previewImageUrl.filter(_.trim.nonEmpty).map(_.trim).getOrElse(existing.previewImageUrl),
              mechanismTagsJson = BirdRowMapper.encodeStringList(input.mechanismTags),
              status = LevelStatus.Draft,
              rejectionReason = None,
              updatedAt = timestamp
            )
            BirdDesignTable.updateEditable(connection, updatedRow) match {
              case None => Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be updated"))
              case Some(row) => Right(BirdRowMapper.toBirdDesign(row))
            }
          }
        )
      } yield design
    }
}
