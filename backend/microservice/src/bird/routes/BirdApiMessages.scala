package microservice.bird.routes

import io.circe.generic.auto._
import microservice.bird.api.design.{
  CreateBirdDesignAPIMessage,
  DeleteBirdDesignAPIMessage,
  ListBirdDesignsAPIMessage,
  SubmitBirdDesignAPIMessage,
  UpdateBirdDesignAPIMessage
}
import microservice.bird.api.review.{GetPendingBirdSubmissionsAPIMessage, ReviewBirdSubmissionAPIMessage}
import microservice.bird.objects.design.BirdDesign
import microservice.bird.objects.submission.{BirdSubmission, BirdSubmissionWithDesign, ReviewedBirdSubmission}
import microservice.infrastructure.api.RegisteredAPIMessage
import microservice.infrastructure.api.RegisteredAPIMessage.protectedApi
import org.http4s.Status

object BirdApiMessages {
  val apiMessages: List[RegisteredAPIMessage] = List(
    protectedApi[ListBirdDesignsAPIMessage, List[BirdDesign]](identityFields = List("designerId")),
    protectedApi[CreateBirdDesignAPIMessage, BirdDesign](
      successStatus = Status.Created,
      identityFields = List("designerId")
    ),
    protectedApi[UpdateBirdDesignAPIMessage, BirdDesign](identityFields = List("designerId")),
    protectedApi[DeleteBirdDesignAPIMessage, BirdDesign](identityFields = List("designerId")),
    protectedApi[SubmitBirdDesignAPIMessage, BirdSubmission](
      successStatus = Status.Created,
      identityFields = List("designerId")
    ),
    protectedApi[GetPendingBirdSubmissionsAPIMessage, List[BirdSubmissionWithDesign]](),
    protectedApi[ReviewBirdSubmissionAPIMessage, ReviewedBirdSubmission](identityFields = List("reviewerId"))
  )
}
