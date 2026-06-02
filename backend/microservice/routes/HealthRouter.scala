package microservice.routes

import cats.effect.IO
import microservice.system.api.HealthResponse
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityEncoder._
import org.http4s.dsl.io._

object HealthRouter {
  def routes: HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "health" =>
        Ok(ApiSuccess(HealthResponse(status = "ok")))
    }
}
