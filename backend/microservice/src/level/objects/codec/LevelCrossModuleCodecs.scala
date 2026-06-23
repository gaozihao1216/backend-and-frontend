package microservice.level.objects.codec

import io.circe.{Decoder, Encoder}
import microservice.level.objects.core.Level
import microservice.level.objects.inventory.BirdPool
import microservice.level.objects.social.LevelComment
import microservice.level.objects.submission.SubmissionWithLevel

/** 供其他模块 HTTP 响应使用的 level 类型 Circe 实例（跨模块边界导出）。 */
private[level] object LevelCrossModuleCodecs {
  val defaultBirdPool: BirdPool = BirdPool.default

  implicit val birdPoolEncoder: Encoder[BirdPool] = BirdPool.encoder
  implicit val birdPoolDecoder: Decoder[BirdPool] = BirdPool.decoder
  implicit val levelEncoder: Encoder[Level] = Level.encoder
  implicit val levelDecoder: Decoder[Level] = Level.decoder
  implicit val levelCommentEncoder: Encoder[LevelComment] = LevelComment.encoder
  implicit val levelCommentDecoder: Decoder[LevelComment] = LevelComment.decoder
  implicit val submissionWithLevelEncoder: Encoder[SubmissionWithLevel] = SubmissionWithLevel.encoder
  implicit val submissionWithLevelDecoder: Decoder[SubmissionWithLevel] = SubmissionWithLevel.decoder
}
