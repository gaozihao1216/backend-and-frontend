package coursebackend

import com.comcast.ip4s.{host, port}
import cats.effect.{IO, IOApp}
import org.http4s.ember.server.EmberServerBuilder

object Main extends IOApp.Simple {
  override def run: IO[Unit] =
    EmberServerBuilder
      .default[IO]
      .withHost(host"127.0.0.1")
      .withPort(port"8080")
      .withHttpApp(SystemDefaults.apiRoutes.orNotFound)
      .build
      .use(_ => IO.never)
}
