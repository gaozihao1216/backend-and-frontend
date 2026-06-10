package microservice.routes

import cats.effect.IO
import microservice.admin.routes.AdminRouter
import cats.syntax.semigroupk._
import microservice.infrastructure.database.DatabaseSession
import microservice.user.routes.AuthRouter
import microservice.level.routes.{DesignerLevelRouter, PlayerLevelRouter}
import microservice.bird.routes.DesignerBirdRouter
import microservice.user.routes.UserRouter
import microservice.ui.routes.UiCustomizationRouter
import org.http4s.HttpRoutes
import org.http4s.server.Router

/** 根路由挂载：将各业务模块的 HttpRoutes 拼接到 URL 前缀下。
  *
  * 实现：http4s `Router` 按路径前缀分发；同一前缀下多个 router 用 `<+>` 合并。
  * 关联：每个子 router 接收同一个 [[DatabaseSession]]，供 APIMessage.run 使用。
  * 注意：`/admin/director/ui` 必须写在 `/admin` 之前，避免被更短前缀错误匹配。
  */
object ApiRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    Router(
      "/" -> HealthRouter.routes(databaseSession),
      // user 模块：/auth 绑定与 /users 资料（URL 前缀保持不变）
      "/auth" -> AuthRouter.routes(databaseSession),
      "/users" -> UserRouter.routes(databaseSession),
      // 设计师关卡与鸟类设计共用 /designer 前缀
      "/designer" -> (DesignerLevelRouter.routes(databaseSession) <+> DesignerBirdRouter.routes(databaseSession)),
      // 玩家关卡读/写 + 商店/社交/备战/UI 运行时
      "/player" -> PlayerLevelRouter.routes(databaseSession),
      // 总监 UI 定制（PageConfig、按钮模板等）
      "/admin/director/ui" -> UiCustomizationRouter.routes(databaseSession),
      // 普通管理员审核 + 总监关卡/技能配置
      "/admin" -> AdminRouter.routes(databaseSession)
    )
}
