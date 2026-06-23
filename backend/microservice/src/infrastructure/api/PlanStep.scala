package microservice.infrastructure.api

import cats.data.EitherT
import cats.effect.IO
import microservice.infrastructure.http.HttpError

/** [[APIMessage.plan]] 单步 monad：`EitherT[IO, HttpError, A]`。
  *
  * 从 [[PlanSteps]] 拆出，供鉴权/校验等模块直接返回 IO 步骤，避免与 PlanSteps 循环依赖。
  */
object PlanStep {
  type Step[A] = EitherT[IO, HttpError, A]

  def fromEither[A](check: Either[HttpError, A]): Step[A] =
    EitherT.fromEither[IO](check)

  def liftF[A](io: IO[A]): Step[A] =
    EitherT.liftF(io)

  def liftBlocking[A](run: => A): Step[A] =
    EitherT.liftF(IO.blocking(run))
}
