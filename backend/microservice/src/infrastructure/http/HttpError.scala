package microservice.infrastructure.http

import cats.effect.IO
import microservice.system.objects.{ApiFailure, ErrorBody}
import io.circe.Encoder
import org.http4s.Response
import org.http4s.Status
import org.http4s.circe.CirceEntityEncoder._

/** 统一 HTTP 错误模型，与前端 ApiFailure Zod schema 对齐。
  *
  * 实现：APIMessage 返回 Left(HttpError)；routes 通过 fromEither 转为带 status 的 JSON 响应。
  * 关联：成功响应使用 system.objects.ApiSuccess；二者共同构成 { success, data/error } 契约。
  */
final case class HttpError(
  status: Status,              // HTTP 状态码（400/401/403/404/409 等）
  code: String,                // 机器可读错误码，如 FORBIDDEN、VALIDATION_ERROR
  message: String,             // 面向用户或前端的简短说明
  details: Option[String] = None // 可选补充信息（字段列表、堆栈摘要等）
) {
  /** 转为 ApiFailure JSON 体，供 withEntity 编码。 */
  def toApiFailure: ApiFailure =
    ApiFailure(error = ErrorBody(code = code, message = message, details = details))
}

object HttpError {
  /** 400 Bad Request，携带自定义 code 与可选 details。 */
  def badRequest(code: String, message: String, details: Option[String] = None): HttpError =
    HttpError(Status.BadRequest, code, message, details)

  /** 403 Forbidden，code 固定为 FORBIDDEN。 */
  def forbidden(message: String): HttpError =
    HttpError(Status.Forbidden, "FORBIDDEN", message)

  /** 404 Not Found。 */
  def notFound(code: String, message: String): HttpError =
    HttpError(Status.NotFound, code, message)

  /** 409 Conflict（资源状态冲突、重复提交等）。 */
  def conflict(code: String, message: String): HttpError =
    HttpError(Status.Conflict, code, message)

  /** 401 Unauthorized，code 固定为 UNAUTHORIZED。 */
  def unauthorized(message: String): HttpError =
    HttpError(Status.Unauthorized, "UNAUTHORIZED", message)

  /** 将 HttpError 编码为带对应 status 的 JSON Response。 */
  def toResponse(error: HttpError): IO[Response[IO]] =
    IO.pure(Response[IO](status = error.status).withEntity(error.toApiFailure))

  /** 将 APIMessage 的 Either 结果转为 http4s Response；Right 时编码为 JSON 成功体。 */
  def fromEither[A: Encoder](result: Either[HttpError, A], successStatus: Status = Status.Ok): IO[Response[IO]] =
    result match {
      case Right(value) =>
        // 业务成功：用 successStatus（默认 200）编码 data
        IO.pure(Response[IO](status = successStatus).withEntity(value))
      case Left(error) =>
        // 业务失败：走统一错误 JSON 与 HttpError.status
        toResponse(error)
    }
}
