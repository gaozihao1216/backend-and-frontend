package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.system.objects.LevelTag

/** 玩家关卡路由的公共辅助：解析 query 参数。 */
private[microservice] object PlayerLevelRouteSupport {
  /** 读取 sort 查询参数，默认 "newest"。 */
  def sortParam(req: org.http4s.Request[IO]): String =
    req.params.getOrElse("sort", "newest")

  /** 解析 tag 查询参数：缺省为 None（不过滤）；非法值返回 Left(INVALID_LEVEL_TAG)。 */
  def tagParam(req: org.http4s.Request[IO]): Either[HttpError, Option[LevelTag]] =
    req.params.get("tag") match {
      case None => Right(None)
      case Some(value) =>
        LevelTag.fromString(value).map(tag => Right(Some(tag))).getOrElse(
          Left(HttpError.badRequest("INVALID_LEVEL_TAG", s"Unknown level tag: $value"))
        )
    }
}
