package coursebackend

import com.comcast.ip4s._
import cats.effect.{IO, IOApp}
import org.http4s.ember.server.EmberServerBuilder

object Main extends IOApp.Simple {
  override def run: IO[Unit] =
    EmberServerBuilder
      .default[IO]
      .withHost(Host.fromString("127.0.0.1").get)
      .withPort(Port.fromInt(8080).get)
      .withHttpApp(SystemDefaults.apiRoutes.orNotFound)
      .build
      .use(_ => IO.never)
}
