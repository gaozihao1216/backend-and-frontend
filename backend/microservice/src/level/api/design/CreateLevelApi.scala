package microservice.level.api.design

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.support.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.core.{Level}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelRow}
import microservice.level.objects.design.request.CreateLevelRequest
import microservice.level.validation.design.CreateLevelValidation
import microservice.system.objects.enums.LevelStatus
import microservice.system.objects.enums.UserRole

/** 设计师创建新关卡 APIMessage；authorId 取自 header 而非 body。 */
final case class CreateLevelAPIMessage(
  designerId: String,
  body: CreateLevelRequest
) extends APIWithTokenMessage[Level] {
  override def token: String = designerId

  /** plan 定义了什么业务流程：Designer 创建新关卡，校验 title 后 insert LevelTable，初始 status=Draft。
    *
    * 解决了什么问题：UGC 关卡创作入口，authorId 取自 token 而非 body 防伪造。
    * 在事务内起到什么作用：校验通过后 insert LevelRow；Left 时整笔回滚。
    * 关联的前端 API：POST /designer/levels；前端 `CreateLevelApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Designer
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：校验 title/description/tags/data 等创建字段
        validated <- CreateLevelValidation.validate(body)
        // 步骤 3：分配 id 并插入 LevelRow（status=Draft），映射为 Level
        level <- PlanSteps.read {
          val timestamp = Instant.now().toString
          val row = LevelTable.insert(
            connection,
            LevelRow(
              id = LevelTable.nextId(connection),
              title = validated.title,
              description = validated.description,
              tags = validated.tags,
              data = validated.data,
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
