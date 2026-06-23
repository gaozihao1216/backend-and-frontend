package microservice.routes

import cats.effect.IO
import microservice.admin.routes.AdminRouter
import cats.syntax.semigroupk._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.AuthMiddleware
import microservice.user.routes.AuthRouter
import microservice.level.routes.{DesignerLevelRouter, PlayerLevelRouter}
import microservice.bird.routes.DesignerBirdRouter
import microservice.player.routes.{PlayerPreparationRouter, PlayerSocialRouter, PlayerUiRuntimeRouter}
import microservice.user.routes.UserRouter
import microservice.ui.routes.{UiCustomizationRouter, UiPlayerPageRouter}
import org.http4s.HttpRoutes
import org.http4s.server.Router

/** 根路由挂载：将各业务模块的 `HttpRoutes` 拼接到 URL 前缀下，构成完整 API 树。
  *
  * == 组装方式 ==
  * 使用 http4s `Router` 按最长前缀匹配分发请求，再用 `<+>`（SemigroupK）合并多棵子树。
  * 每个子 Router 接收同一个 [[DatabaseSession]] 实例，保证全进程共享存储模式。
  *
  * == 公开 vs 受保护 ==
  * | 类别 | 前缀 | 鉴权 |
  * |------|------|------|
  * | 公开 | `/`（health）、`/auth` | 无 |
  * | 受保护 | `/users`、`/designer`、`/player`、`/admin`… | [[AuthMiddleware.requireUserId]] |
  *
  * == 路由顺序注意 ==
  * `/admin/director/ui` **必须**写在 `/admin` 之前：
  * http4s `Router` 按声明顺序匹配，若 `/admin` 在前，总监 UI 路径会被 AdminRouter 错误截获。
  *
  * == 与 Main 的关系 ==
  * `SystemDefaults.apiRoutes` 委托本对象的 `routes(databaseSession)`，
  * 由 [[microservice.Main]] 挂载到 Ember `withHttpApp`。
  *
  * == 扩展新模块 ==
  * 1. 在对应模块 `routes` 包新增 `XxxRouter.routes(databaseSession)`；
  * 2. 按角色加入 `publicRoutes` 或 `protectedRoutes` 的 `Router(...)`；
  * 3. 同步更新前端 `vite.config.ts` proxy 列表。
  */
object ApiRouter {
  /** 构建完整 API 路由树。
    *
    * @param databaseSession 当前进程的数据库会话（启动时由 SystemDefaults 选定 in-memory 或 JDBC）
    */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] = {
    // 无需 x-user-id 的公开端点：健康检查、登录绑定
    val publicRoutes =
      Router(
        "/" -> HealthRouter.routes(databaseSession),
        "/auth" -> AuthRouter.routes(databaseSession)
      )

    // 其余业务 API：统一经过 requireUserId 中间件
    val protectedRoutes =
      AuthMiddleware.requireUserId(
        Router(
          "/users" -> UserRouter.routes(databaseSession),
          // designer 下合并关卡与鸟类设计两棵子树
          "/designer" -> (DesignerLevelRouter.routes(databaseSession) <+> DesignerBirdRouter.routes(databaseSession)),
          "/player" -> (
            PlayerLevelRouter.routes(databaseSession) <+>
              UiPlayerPageRouter.routes(databaseSession) <+>
              PlayerUiRuntimeRouter.routes(databaseSession) <+>
              PlayerSocialRouter.routes(databaseSession) <+>
              PlayerPreparationRouter.routes(databaseSession)
          ),
          // 总监 UI 定制：路径更长，须排在 /admin 之前
          "/admin/director/ui" -> UiCustomizationRouter.routes(databaseSession),
          "/admin" -> AdminRouter.routes(databaseSession)
        )
      )

    // 公开路由与受保护路由合并；先匹配 public，再匹配 protected
    publicRoutes <+> protectedRoutes
  }
}
