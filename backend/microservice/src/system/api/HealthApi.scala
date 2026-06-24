package microservice.system.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.HealthResponse

/** 健康检查 APIMessage。
  *
  * 定义：无入参的 APIMessage，返回 [[HealthResponse]]。
  * 问题：负载均衡与前端 dev proxy 需要轻量端点确认后端进程存活。
  * 作用：跳过数据库与鉴权，固定返回 status = "ok"。
  * 关联：[[microservice.routes.HealthRouter]]，经 `GET /health` 调用。
  */
final case class HealthAPIMessage() extends APIMessage[HealthResponse] {
  /** plan 实现：构造存活响应，不读写 connection。
    *
    * 定义：PlanSteps.finish + PlanSteps.read 单步流水线。
    * 问题：health 不应因 DB 不可用而失败。
    * 作用：向调用方证明 http4s 服务已就绪。
    * 关联：[[HealthResponse]] JSON 编码由 Circe derive 完成。
    */
  override def plan(connection: Connection): IO[Either[HttpError, HealthResponse]] =
    PlanSteps.finish {
      // --- 1. 返回固定 ok 状态，忽略 connection ---
      PlanSteps.read(HealthResponse(status = "ok"))
    }
}
