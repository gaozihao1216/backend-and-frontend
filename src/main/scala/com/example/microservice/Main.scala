package com.example.microservice

import cats.effect.{IO, IOApp}
import com.example.microservice.api.UserRoutes
import com.example.microservice.service.{DbConfig, UserService}
import org.http4s.ember.server.EmberServerBuilder
import com.comcast.ip4s._
import org.http4s.server.Router

object Main extends IOApp.Simple {
  private val dbConfig = DbConfig(
    url = sys.env.getOrElse("POSTGRES_URL", "jdbc:postgresql://localhost:5432/userservice"),
    user = sys.env.getOrElse("POSTGRES_USER", "postgres"),
    password = sys.env.getOrElse("POSTGRES_PASSWORD", "postgres")
  )

  override def run: IO[Unit] =
    for {
      userService <- IO(new UserService(dbConfig))
      _ <- userService.initialize()
      httpApp = Router(
        "/" -> UserRoutes.routes(userService)
      ).orNotFound
      _ <- EmberServerBuilder
        .default[IO]
        .withHost(host"0.0.0.0")
        .withPort(port"8080")
        .withHttpApp(httpApp)
        .build
        .useForever
    } yield ()
}
