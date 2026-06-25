package microservice.infrastructure.http

import cats.effect.IO
import microservice.system.objects.api.{ApiFailure, ErrorBody}
import io.circe.Encoder
import org.http4s.Response
import org.http4s.Status
import org.http4s.circe.CirceEntityEncoder._

/** 统一 HTTP 错误模型，与前端 `ApiFailure` Zod schema 一一对应。
  *
  * == 在架构中的位置 ==
  * ```
  * APIMessage.plan  →  Either[HttpError, A]
  *       ↓
  * APIMessageRouter →  HttpError.fromEither(result)
  *       ↓
  * HTTP Response    →  { "success": false, "error": { code, message, details? } }
  * ```
  *
  * == 与成功响应的对称 ==
  * - 失败：`HttpError` → `ApiFailure`（`success: false`）；
  * - 成功：业务类型 `A`（通常包装为 `ApiSuccess(data)`，`success: true`）。
  *
  * == 设计原则 ==
  * 业务可预期失败（权限不足、资源不存在、校验错误）一律返回 `Left(HttpError)`，
  * 禁止用抛异常表达业务分支，以便事务层能按 `Either` 回滚而不污染控制流。
  *
  * == 关联 ==
  * - [[microservice.infrastructure.api.APIMessage]]：plan 的错误载体
  * - [[microservice.infrastructure.api.APIMessageRouter]]：统一将 `Either` 转为 HTTP 响应
  * - 前端 `frontend/src/objects/system/` 中的 `ApiFailureSchema`
  */
final case class HttpError(
  status: Status,              // HTTP 状态码（400/401/403/404/409 等），决定响应行
  code: String,                // 机器可读错误码，前端可据此分支 UI（如 FORBIDDEN、VALIDATION_ERROR）
  message: String,             // 面向用户或前端的简短说明，可直接展示在 toast/表单错误区
  details: Option[String] = None // 可选补充：字段列表、冲突原因、调试摘要等
) {
  /** 转为 API 契约中的 `ApiFailure` 结构，供 Circe `withEntity` 编码为 JSON。 */
  def toApiFailure: ApiFailure =
    ApiFailure(error = ErrorBody(code = code, message = message, details = details))
}

object HttpError {
  /** 400 Bad Request：请求体/参数不合法。
    *
    * @param code 细粒度错误码，如 `VALIDATION_ERROR`、`INVALID_PAYLOAD`
    */
  def badRequest(code: String, message: String, details: Option[String] = None): HttpError =
    HttpError(Status.BadRequest, code, message, details)

  /** 403 Forbidden：已认证但权限不足；`code` 固定为 `FORBIDDEN`。 */
  def forbidden(message: String): HttpError =
    HttpError(Status.Forbidden, "FORBIDDEN", message)

  /** 404 Not Found：资源不存在或当前用户无权查看（对外统一 404 时可自定义 code）。 */
  def notFound(code: String, message: String): HttpError =
    HttpError(Status.NotFound, code, message)

  /** 409 Conflict：资源状态冲突（重复提交、乐观锁失败、非法状态迁移等）。 */
  def conflict(code: String, message: String): HttpError =
    HttpError(Status.Conflict, code, message)

  /** 401 Unauthorized：未提供或无效的身份凭证；`code` 固定为 `UNAUTHORIZED`。 */
  def unauthorized(message: String): HttpError =
    HttpError(Status.Unauthorized, "UNAUTHORIZED", message)

  /** 将单个 `HttpError` 编码为带对应 status 的 JSON Response（不经过 `fromEither`）。 */
  def toResponse(error: HttpError): IO[Response[IO]] =
    IO.pure(Response[IO](status = error.status).withEntity(error.toApiFailure))

  /** 将 `APIMessage.run` 的 `Either` 结果转为 http4s `Response`。
    *
    * @param result plan 或 run 的返回值
    * @param successStatus 业务成功时的 HTTP 状态，默认 200；创建资源可传 `Status.Created`
    * @tparam A 成功时的响应体类型，须有隐式 `Encoder[A]`（通常为 `ApiSuccess[T]`）
    */
  def fromEither[A: Encoder](result: Either[HttpError, A], successStatus: Status = Status.Ok): IO[Response[IO]] =
    result match {
      case Right(value) =>
        // 业务成功：用 successStatus（默认 200）编码 JSON 成功体
        IO.pure(Response[IO](status = successStatus).withEntity(value))
      case Left(error) =>
        // 业务失败：走统一错误 JSON 与 HttpError.status
        toResponse(error)
    }
}
