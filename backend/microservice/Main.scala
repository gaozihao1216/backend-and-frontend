package microservice

import com.comcast.ip4s._
import cats.effect.{IO, IOApp}
import microservice.core.SystemDefaults
import org.http4s.ember.server.EmberServerBuilder

object Main extends IOApp.Simple {
  override def run: IO[Unit] =
    EmberServerBuilder
      .default[IO]
      .withHost(Host.fromString("127.0.0.1").get)
      .withPort(Port.fromInt(3000).get)
      .withHttpApp(SystemDefaults.apiRoutes.orNotFound)
      .build
      .use(_ => IO.never)
}
