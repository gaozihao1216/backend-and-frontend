package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.BirdSubmissionWithDesign
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.BirdRowMapper
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel

final case class GetPendingBirdSubmissionsAPIMessage(userId: String)
    extends APIWithTokenMessage[List[BirdSubmissionWithDesign]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[BirdSubmissionWithDesign]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        submissions <- PlanSteps.read(
          BirdSubmissionTable
            .listPending(connection)
            .flatMap { submission =>
              BirdDesignTable.findById(connection, submission.birdDesignId).map { design =>
                BirdSubmissionWithDesign.from(
                  BirdRowMapper.toBirdSubmission(submission),
                  BirdRowMapper.toBirdDesign(design)
                )
              }
            }
            .toList
        )
      } yield submissions
    }
}
