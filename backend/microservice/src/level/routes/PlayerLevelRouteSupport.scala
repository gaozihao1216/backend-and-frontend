package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.system.objects.LevelTag

private[microservice] object PlayerLevelRouteSupport {
  def currentUserId(req: org.http4s.Request[IO]): Option[String] =
    req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)

  def sortParam(req: org.http4s.Request[IO]): String =
    req.params.getOrElse("sort", "newest")

  def tagParam(req: org.http4s.Request[IO]): Either[HttpError, Option[LevelTag]] =
    req.params.get("tag") match {
      case None => Right(None)
      case Some(value) =>
        LevelTag.fromString(value).map(tag => Right(Some(tag))).getOrElse(
          Left(HttpError.badRequest("INVALID_LEVEL_TAG", s"Unknown level tag: $value"))
        )
    }
}
