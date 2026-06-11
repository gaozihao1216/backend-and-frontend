package microservice.level.routes

import cats.effect.IO
import microservice.infrastructure.database.{DatabaseSession}
import microservice.infrastructure.http.{HttpError}
import microservice.level.api.{CreateLevelAPIMessage, CreateLevelBody, SubmitLevelAPIMessage, SubmitLevelBody}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.Status
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 设计师关卡 HTTP 入口：创建 draft 关卡、提交审核。
  *
  * 实现：从 x-user-id 读取 designerId（不信任 body 中的作者字段），解析 JSON 后调用 APIMessage。
  * 关联：POST /designer/levels → CreateLevelAPIMessage；POST /designer/submissions → SubmitLevelAPIMessage。
  */
object DesignerLevelRouter {
  /** 注册设计师侧关卡路由，挂载在 /designer 前缀下（由 ApiRouter 组合）。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // ── 创建新关卡（Draft） ────────────────────────────────────────────────
      case req @ POST -> Root / "levels" =>
        // 从请求头提取当前设计师 ID，body 中不含可信的作者信息
        val designerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        designerId match {
          case Some(currentDesignerId) =>
            // 解析 JSON body → CreateLevelBody，再委托 APIMessage 执行业务逻辑
            req.as[CreateLevelBody].flatMap { body =>
              CreateLevelAPIMessage(currentDesignerId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(level => ApiSuccess(level)), successStatus = Status.Created))
            }
          case None =>
            // 缺少鉴权头，直接返回 401
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      // ── 提交关卡审核 ─────────────────────────────────────────────────────────
      case req @ POST -> Root / "submissions" =>
        val designerId = req.headers.headers.find(_.name.toString.equalsIgnoreCase("x-user-id")).map(_.value)
        designerId match {
          case Some(currentDesignerId) =>
            // body 仅含 levelId；归属校验在 SubmitLevelAPIMessage.plan 内完成
            req.as[SubmitLevelBody].flatMap { body =>
              SubmitLevelAPIMessage(currentDesignerId, body)
                .run(databaseSession)
                .flatMap(result => HttpError.fromEither(result.map(submission => ApiSuccess(submission)), successStatus = Status.Created))
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }
}
