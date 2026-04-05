package com.example.microservice.api

import org.http4s.circe.CirceEntityCodec._
import io.circe.generic.auto._
import cats.effect.IO
import com.example.microservice.model.{CreateUserRequest, HealthStatus}
import com.example.microservice.service.UserService
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object UserRoutes {
  def routes(userService: UserService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "health" =>
        Ok(HealthStatus("ok"))

      case req @ POST -> Root / "users" =>
        for {
          createUserRequest <- req.as[CreateUserRequest]
          createdUser <- userService.createUser(createUserRequest)
          response <- Created(createdUser)
        } yield response

      case GET -> Root / "users" / LongVar(id) =>
        userService.getUser(id).flatMap {
          case Some(user) => Ok(user)
          case None => NotFound(s"User with id=$id was not found")
        }
    }
}
