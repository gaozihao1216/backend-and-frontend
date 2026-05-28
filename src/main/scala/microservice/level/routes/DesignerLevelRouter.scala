package microservice.level.routes

import cats.effect.IO
import microservice.core.HttpError
import microservice.level.api.{CreateLevelBody, CreateLevelRequest, DesignerLevelService}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object DesignerLevelRouter {
  def routes(designerLevelService: DesignerLevelService): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "levels" =>
        val designerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        designerId match {
          case Some(currentDesignerId) =>
            req.as[CreateLevelBody].flatMap { body =>
              HttpError.fromEither(
                designerLevelService
                  .createLevel(
                    CreateLevelRequest(
                      designerId = currentDesignerId,
                      title = body.title,
                      description = body.description,
                      tags = body.tags,
                      data = body.data
                    )
                  )
                  .map(response => ApiSuccess(response.level)),
                successStatus = Status.Created
              )
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
