package com.example.microservice.model

import io.circe.Codec
import io.circe.generic.semiauto._

final case class User(id: Long, name: String, email: String)
object User {
  implicit val codec: Codec[User] = deriveCodec[User]
}

final case class CreateUserRequest(name: String, email: String)
object CreateUserRequest {
  implicit val codec: Codec[CreateUserRequest] = deriveCodec[CreateUserRequest]
}

final case class HealthStatus(status: String)
object HealthStatus {
  implicit val codec: Codec[HealthStatus] = deriveCodec[HealthStatus]
}