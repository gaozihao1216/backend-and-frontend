package microservice.system.objects

import io.circe.Encoder

/** 成功响应的统一 JSON 包装。
  *
  * 定义：泛型 case class，success 默认 true，data 承载业务体 T。
  * 问题：前后端需统一 { success, data } 形状以便 client.request + Zod 校验。
  * 作用：routes 在 Right 分支包装 APIMessage 返回值后 Circe 编码。
  * 关联：[[HttpError.fromEither]]、前端 createSuccessResponseSchema；与 [[ApiFailure]] 对称。
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
