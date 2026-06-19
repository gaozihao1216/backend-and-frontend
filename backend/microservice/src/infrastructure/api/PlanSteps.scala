package microservice.infrastructure.api

import cats.data.EitherT
import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl

/** [[APIMessage.plan]] 内部的步骤组合工具（基于 `EitherT[IO, HttpError, *]`）。
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
  *       _      <- PlanSteps.require(AccessControl.requireRole(...))
  *       _      <- PlanSteps.requireBound(headerUserId, token)
  *       entity <- PlanSteps.read(SomeTable.findById(connection, id))
  *       result <- PlanSteps.attempt(validateAndTransform(entity))
  *       _      <- PlanSteps.blocking(SomeTable.update(connection, result))
  *     } yield Response(...)
  *   }
  * }}}
  *
  * == 与 APIMessage 的分工 ==
  * - `PlanSteps`：plan 内部的步骤编排与错误短路；
  * - `APIMessage.run`：plan 外部的连接获取与事务提交/回滚。
  *
  * == 关联 ==
  * - [[microservice.infrastructure.http.HttpError]]：所有步骤的错误载体
  * - [[microservice.user.utils.AccessControl]]：角色与身份绑定校验
  */
object PlanSteps {
  /** 单步类型别名：`EitherT` 将 `IO[Either[HttpError, A]]` 扁平化为可 `flatMap` 的 monad。 */
  type Step[A] = EitherT[IO, HttpError, A]

  /** 将同步校验结果注入步骤链；`Left` 时后续 `flatMap` 不再执行。
    *
    * @param check 通常为 `AccessControl.requireRole` / `requireAdminLevel` 等返回的 `Either`
    */
  def require[A](check: Either[HttpError, A]): Step[A] =
    EitherT.fromEither[IO](check)

  /** 校验 HTTP 头 `x-user-id` 与请求体/路径中的 `token` 是否为同一绑定用户。
    *
    * 用于 `APIWithTokenMessage` 子类在 plan 内部做二次校验，或无需该 trait 时的显式步骤。
    */
  def requireBound(headerUserId: String, token: String): Step[Unit] =
    require(AccessControl.requireBoundIdentity(headerUserId, token))

  /** 执行同步读操作（Table 查询、内存集合访问等），结果包装为 `Right`。
    *
    * 适用于不会失败的纯读取；若读取可能业务失败，请用 [[attempt]]。
    */
  def read[A](run: => A): Step[A] =
    EitherT.liftF(IO(run))

  /** 执行同步步骤，步骤本身返回 `Either[HttpError, A]`（如字段校验、状态机检查）。
    *
    * 与 [[read]] 的区别：此处允许步骤内部表达业务失败。
    */
  def attempt[A](run: => Either[HttpError, A]): Step[A] =
    EitherT.fromEither[IO](run)

  /** 在 `IO.blocking` 线程池中执行可能阻塞的操作（JDBC 批量写入、文件 I/O 等）。
    *
    * cats-effect 要求阻塞调用不得运行在 compute 线程池上，以免饿死其他 fiber。
    */
  def blocking[A](run: => A): Step[A] =
    EitherT.liftF(IO.blocking(run))

  /** 将完整的 `Step` 链还原为 `IO[Either[HttpError, A]]`，供 [[APIMessage.plan]] 返回。
    *
    * 每个 plan 实现应以 `PlanSteps.finish { for { ... } yield ... }` 结尾。
    */
  def finish[A](plan: Step[A]): IO[Either[HttpError, A]] =
    plan.value
}
