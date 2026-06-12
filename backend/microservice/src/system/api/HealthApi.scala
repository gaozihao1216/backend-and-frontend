package microservice.system.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}

/** GET /health 的响应体；status 固定为 "ok" 表示进程存活。 */
final case class HealthResponse(
  status: String // 健康状态字面量，当前恒为 "ok"
)

object HealthResponse {
  implicit val encoder: Encoder[HealthResponse] = deriveEncoder
  implicit val decoder: Decoder[HealthResponse] = deriveDecoder
}

/** 健康检查 APIMessage，不访问数据库，仅返回存活信号。
  *
  * 实现：plan 恒为 Right(HealthResponse("ok"))。
  * 关联：[[microservice.routes.HealthRouter]] 挂载 GET /health 并包装为 ApiSuccess。
  */
final case class HealthAPIMessage() extends APIMessage[HealthResponse] {
  override def plan(connection: Connection): IO[Either[HttpError, HealthResponse]] =
    // 无业务校验；connection 在 in-memory 模式下为 null，此处不使用
    PlanSteps.finish {
      PlanSteps.read(HealthResponse(status = "ok"))
    }
}
