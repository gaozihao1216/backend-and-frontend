package microservice.bird.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.BirdDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdDesignRow, BirdRowMapper}
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 创建鸟类设计请求体：属性值、三档 tierSkills、可选预览图与机制标签。 */
final case class CreateBirdDesignBody(
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkills: List[String],
  previewImageUrl: Option[String] = None,
  mechanismTags: List[String] = List.empty
)

object CreateBirdDesignBody {
  implicit val encoder: Encoder[CreateBirdDesignBody] = deriveEncoder
  implicit val decoder: Decoder[CreateBirdDesignBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateBirdDesignBody] = jsonOf
}

/** 设计师创建新鸟类设计，初始状态为 Draft。
  *
  * 实现：requireRole(Designer) → BirdDesignValidation.validate → BirdDesignTable.insert。
  * 关联：POST /designer/bird-designs；previewImageUrl 缺省时使用 BirdDesignTable.defaultPreviewImageUrl。
  */
final case class CreateBirdDesignAPIMessage(designerId: String, body: CreateBirdDesignBody)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).flatMap { _ =>
        BirdDesignValidation.validate(toInput(body)).map { input =>
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
      }
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
