package microservice.level.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.{CreateLevelErrors, Level}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelRow}
import microservice.system.objects.LevelStatus
import microservice.system.objects.UserRole

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
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        // title 不能为空（trim 后）
        _ <- PlanSteps.require(
          if (body.title.trim.isEmpty) {
            Left(CreateLevelErrors.CreateLevelValidation(List("title")).toHttpError)
          } else {
            Right(())
          }
        )
        level <- PlanSteps.read {
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
          LevelRowMapper.toLevel(row)
        }
      } yield level
    }
}
