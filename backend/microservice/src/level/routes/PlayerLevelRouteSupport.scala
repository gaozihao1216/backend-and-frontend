package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.system.objects.LevelTag

/** 玩家关卡路由的公共辅助：解析 x-user-id 与 query 参数。
  *
  * 实现：统一从请求头读取当前用户；tag/sort 用于 GET /player/levels 筛选与排序。
  * 关联：PlayerLevelReadRouter、PlayerLevelActionRouter 共用，避免各 route 重复解析逻辑。
  */
private[microservice] object PlayerLevelRouteSupport {
  /** 从请求头读取当前用户 ID；演示鉴权，前端 client.ts 在每个请求注入 x-user-id。 */
  def currentUserId(req: org.http4s.Request[IO]): Option[String] =
    req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)

  /** 读取 sort 查询参数，默认 "newest"；传给 LevelTable.listPublished 决定排序方式。 */
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
