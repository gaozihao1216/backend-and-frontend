package microservice.admin.api.director.level_assignment

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.BirdPool
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 将已批准关卡投稿分配到指定槽位（level01–level10），可附带 bird pool 配置。 */
final case class AssignLevelSlotBody(
  submissionId: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)

object AssignLevelSlotBody {
  implicit val encoder: Encoder[AssignLevelSlotBody] = deriveEncoder
  implicit val decoder: Decoder[AssignLevelSlotBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AssignLevelSlotBody] = jsonOf
}

/** 更新已分配槽位的 bird pool（玩家备战可选鸟列表）。 */
final case class UpdateLevelSlotBirdPoolBody(
  birdPool: BirdPool
)

object UpdateLevelSlotBirdPoolBody {
  implicit val encoder: Encoder[UpdateLevelSlotBirdPoolBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateLevelSlotBirdPoolBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateLevelSlotBirdPoolBody] = jsonOf
}

/** 废止已批准投稿：解除槽位绑定、Submission 标记 Abolished、Level 回退为 Rejected。 */
final case class AbolishDirectorSubmissionBody(
  note: Option[String]
)

object AbolishDirectorSubmissionBody {
  implicit val encoder: Encoder[AbolishDirectorSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[AbolishDirectorSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AbolishDirectorSubmissionBody] = jsonOf
}
