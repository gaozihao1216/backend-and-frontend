package microservice.framework

final case class ApiEndpoint[Req, Res, Err <: ApiError](
  name: String,
  method: HttpMethod,
  path: String,
  description: String,
  businessRules: List[String]
)

object ApiHandler {
  type Handler[F[_], Req, Res, Err <: ApiError] = Req => F[Either[Err, Res]]
}
