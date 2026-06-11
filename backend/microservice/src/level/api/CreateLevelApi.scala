package microservice.level.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.{CreateLevelErrors, Level, LevelData}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelRow}
import microservice.system.objects.LevelStatus
import microservice.system.objects.LevelTag
import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /designer/levels 的请求体：关卡元数据与编辑器 JSON。 */
final case class CreateLevelBody(
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData
)

object CreateLevelBody {
  implicit val encoder: Encoder[CreateLevelBody] = deriveEncoder
  implicit val decoder: Decoder[CreateLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateLevelBody] = jsonOf
}

/** 设计师创建新关卡 APIMessage；authorId 取自 header 而非 body。 */
final case class CreateLevelAPIMessage(
  designerId: String,
  body: CreateLevelBody
) extends APIWithTokenMessage[Level] {
  override def token: String = designerId

  /** 设计师创建新关卡，初始状态为 Draft。
    *
    * 实现：requireRole(Designer) → 校验 title → LevelTable.insert → RowMapper 转领域对象 Level。
    * 关联：authorId 取自 header 中的 designerId；前端 objects/level/level.ts 的 Level schema 对齐返回结构。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).flatMap { _ =>
        // title 不能为空（trim 后）
        if (body.title.trim.isEmpty) {
          Left(CreateLevelErrors.CreateLevelValidation(List("title")).toHttpError)
        } else {
        val timestamp = Instant.now().toString
        // 组装 LevelRow 并插入；status 固定为 Draft，评分字段初始化为 0
        val row = LevelTable.insert(
          connection,
          LevelRow(
            id = LevelTable.nextId(connection),
            title = body.title.trim,
            description = body.description,
            tags = body.tags,
            data = body.data,
            authorId = designerId,
            status = LevelStatus.Draft,
            rejectionReason = None,
            averageRating = 0,
            ratingCount = 0,
            createdAt = timestamp,
            updatedAt = timestamp,
            publishedAt = None
          )
        )
        Right(LevelRowMapper.toLevel(row))
        }
      }
    }
}
