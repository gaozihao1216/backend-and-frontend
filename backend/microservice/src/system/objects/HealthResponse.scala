package microservice.system.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** GET /health 的响应体。
  *
  * 定义：仅含 status 字段的 case class，Circe 自动编解码。
  * 问题：监控与 dev 工具需要最小 JSON 而非空 204。
  * 作用：status 固定为 "ok" 表示进程存活、路由可达。
  * 关联：[[HealthAPIMessage]] 成功载荷；前端可不校验 schema 仅看 200。
  */
final case class HealthResponse(
  status: String // 存活标志，当前恒为 "ok"
)

/** HealthResponse 伴生对象：健康检查响应的 Circe JSON 编解码。 */
object HealthResponse {
  implicit val encoder: Encoder[HealthResponse] = deriveEncoder
  implicit val decoder: Decoder[HealthResponse] = deriveDecoder
}
