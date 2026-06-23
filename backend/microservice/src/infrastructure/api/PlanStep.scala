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

  /** 将 IO 动作提升为 Step（无副作用读操作）。 */
  def liftF[A](io: IO[A]): Step[A] =
    EitherT.liftF(io)

  /** 在 blocking 线程池执行同步阻塞操作并提升为 Step。 */
  def liftBlocking[A](run: => A): Step[A] =
    EitherT.liftF(IO.blocking(run))

  /** 以 HttpError 短路步骤链。 */
  def fail[A](error: HttpError): Step[A] =
    EitherT.leftT(error)

  /** 注入成功值。 */
  def succeed[A](value: A): Step[A] =
    EitherT.rightT(value)
}
