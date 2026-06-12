package microservice.system.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.HealthResponse

/** 健康检查 APIMessage，不访问数据库，仅返回存活信号。 */
final case class HealthAPIMessage() extends APIMessage[HealthResponse] {
  override def plan(connection: Connection): IO[Either[HttpError, HealthResponse]] =
    PlanSteps.finish {
      PlanSteps.read(HealthResponse(status = "ok"))
    }
}
