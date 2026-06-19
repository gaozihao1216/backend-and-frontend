package microservice.admin.api.director.level_assignment

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.inventory.BirdPool
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 将已批准关卡投稿分配到指定槽位的请求体。
  *
  * @param submissionId 须为 Approved 状态的投稿 ID
  * @param note 可选分配备注，供总监记录
  * @param birdPool 玩家备战可选鸟列表；缺省则用 BirdPool.default
  */
final case class AssignLevelSlotBody(
  submissionId: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)

/** AssignLevelSlotBody 的 Circe/http4s 编解码 companion。 */
object AssignLevelSlotBody {
  implicit val encoder: Encoder[AssignLevelSlotBody] = deriveEncoder
  implicit val decoder: Decoder[AssignLevelSlotBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AssignLevelSlotBody] = jsonOf
}

/** 更新已分配槽位 bird pool 的请求体。
  *
  * @param birdPool 新的备战鸟池配置，覆盖槽位现有 birdPool
  */
final case class UpdateLevelSlotBirdPoolBody(
  birdPool: BirdPool
)

/** UpdateLevelSlotBirdPoolBody 的 Circe/http4s 编解码 companion。 */
object UpdateLevelSlotBirdPoolBody {
  implicit val encoder: Encoder[UpdateLevelSlotBirdPoolBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateLevelSlotBirdPoolBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateLevelSlotBirdPoolBody] = jsonOf
}

/** 总监废止已批准投稿的请求体。
  *
  * @param note 可选废止原因，写入 reviewNote 与 Level.rejectionReason
  */
final case class AbolishDirectorSubmissionBody(
  note: Option[String]
)

/** AbolishDirectorSubmissionBody 的 Circe/http4s 编解码 companion。 */
object AbolishDirectorSubmissionBody {
  implicit val encoder: Encoder[AbolishDirectorSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[AbolishDirectorSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AbolishDirectorSubmissionBody] = jsonOf
}
