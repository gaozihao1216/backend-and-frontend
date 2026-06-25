package microservice.level.objects.player.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /player/levels/:levelId/ratings 的请求对象。 */
final case class RateLevelRequest(
  score: Int
)

private[level] object RateLevelRequest {
  implicit val encoder: Encoder[RateLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[RateLevelRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, RateLevelRequest] = jsonOf
}
