package microservice.routes

import cats.effect.IO
import microservice.core.{DatabaseSession, HttpError}
import microservice.system.api.HealthAPIMessage
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.dsl.io._

object HealthRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "health" =>
        HealthAPIMessage()
          .run(databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(health => ApiSuccess(health))))
    }
}
