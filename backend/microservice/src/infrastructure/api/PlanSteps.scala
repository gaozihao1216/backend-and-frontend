package microservice.infrastructure.api

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.http.HttpError
import microservice.user.support.AccessControl

/** [[APIMessage.plan]] 内部的步骤组合工具（基于 [[PlanStep.Step]]）。
  *
  * == 设计意图 ==
  * 用 `for` 推导式将多步业务（鉴权 → 校验 → 读表 → 写表 → 组装响应）写成线性流程，
  * 任一步返回 `Left(HttpError)` 时自动短路，后续步骤不再执行。
  *
  * == 典型用法 ==
  * {{{
  * override def plan(connection: Connection): IO[Either[HttpError, Response]] =
  *   PlanSteps.finish {
  *     for {
  *       _      <- AccessControl.requireRole(connection, userId, UserRole.Player)
  *       body   <- SomeValidation.validate(requestBody)
  *       entity <- SomeAccess.requireExisting(connection, body.id)
  *       _      <- PlanSteps.read(SomeTable.insert(connection, entity))
  *       _      <- PlanSteps.blocking(SomeTable.syncIndex(connection))
  *     } yield Response(...)
  *   }
  * }}}
  *
  * APIMessage 内只应出现 `AccessControl` / `*Validation` / `*Support` / `*Access` 的 `require*`，
  * 以及 `PlanSteps.read` / `blocking`。
  *
  * == 与 APIMessage 的分工 ==
  * - `PlanSteps`：plan 内部的步骤编排与错误短路；
  * - `APIMessage.run`：plan 外部的连接获取与事务提交/回滚。
  *
  * == 关联 ==
  * - [[microservice.infrastructure.http.HttpError]]：所有步骤的错误载体
  * - [[microservice.user.support.AccessControl]]：角色与身份绑定校验
  */
object PlanSteps {
  type Step[A] = PlanStep.Step[A]

  /** 执行同步读操作（Table 查询、内存集合访问等），结果包装为 `Right`。 */
  def read[A](run: => A): Step[A] =
    PlanStep.liftF(IO(run))

  /** 在 `IO.blocking` 线程池中执行可能阻塞的操作（JDBC 批量写入、文件 I/O 等）。 */
  def blocking[A](run: => A): Step[A] =
    PlanStep.liftBlocking(run)

  /** 在同一 `Connection` / 事务内执行另一模块的 [[APIMessage]]（模块间调用入口）。 */
  def runApi[A](api: APIMessage[A], connection: Connection): Step[A] =
    EitherT(api.plan(connection))

  /** 接入 support/validation 暴露的 IO[Either] 结果，保持 API plan 内部仍可线性编排。 */
  def fromEither[A](run: IO[Either[HttpError, A]]): Step[A] =
    EitherT(run)

  /** 将完整的 `Step` 链还原为 `IO[Either[HttpError, A]]`，供 [[APIMessage.plan]] 返回。
    *
    * 每个 plan 实现应以 `PlanSteps.finish { for { ... } yield ... }` 结尾。
    */
  def finish[A](plan: Step[A]): IO[Either[HttpError, A]] =
    plan.value
}
