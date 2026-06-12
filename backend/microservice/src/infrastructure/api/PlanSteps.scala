package microservice.infrastructure.api

import cats.data.EitherT
import cats.effect.IO
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl

/** APIMessage.plan 的步骤组合：用 `for` 推导表达「鉴权 → 校验 → 读写 → 返回」。 */
object PlanSteps {
  type Step[A] = EitherT[IO, HttpError, A]

  /** 权限或业务校验：Left 时短路，不再执行后续步骤。 */
  def require[A](check: Either[HttpError, A]): Step[A] =
    EitherT.fromEither[IO](check)

  /** 校验 x-user-id 与 token 绑定（plan 内可选第二步）。 */
  def requireBound(headerUserId: String, token: String): Step[Unit] =
    require(AccessControl.requireBoundIdentity(headerUserId, token))

  /** 同步读/写（Table 调用），成功即 Right。 */
  def read[A](run: => A): Step[A] =
    EitherT.liftF(IO(run))

  /** 同步步骤，本身返回 Either。 */
  def attempt[A](run: => Either[HttpError, A]): Step[A] =
    EitherT.fromEither[IO](run)

  /** 可能阻塞的 IO（如 JDBC 批量写入）。 */
  def blocking[A](run: => A): Step[A] =
    EitherT.liftF(IO.blocking(run))

  def finish[A](plan: Step[A]): IO[Either[HttpError, A]] =
    plan.value
}
