package microservice.system.objects

import io.circe.Encoder

/** 成功响应的统一 JSON 包装，与前端 createSuccessResponseSchema 对齐。
  *
  * 序列化形状：{ "success": true, "data": T }。
  * 关联：routes 在 HttpError.fromEither 的 Right 分支将业务数据包入 ApiSuccess 后编码。
  */
final case class ApiSuccess[T](
  data: T,                      // 业务载荷，类型由各 APIMessage 的返回类型决定
  success: Boolean = true       // 恒为 true，与前端 success 字段约定一致
)

object ApiSuccess {
  /** 显式字段顺序编码 success 再 data，避免 derive 字段序与前端约定不一致。 */
  implicit def encoder[T: Encoder]: Encoder[ApiSuccess[T]] =
    Encoder.forProduct2("success", "data")(response => (response.success, response.data))
}
