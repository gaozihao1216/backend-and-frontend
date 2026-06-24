package microservice

import com.comcast.ip4s._
import cats.effect.{IO, IOApp}
import microservice.system.utils.SystemDefaults
import org.http4s.ember.server.EmberServerBuilder

/** 后端进程唯一入口（`IOApp.Simple`）。
  *
  * == 职责 ==
  * 1. 在 HTTP 监听之前完成 JDBC 数据库初始化；
  * 2. 将 [[SystemDefaults.apiRoutes]] 挂载为 http4s 应用；
  * 3. 以 Ember 为运行时，在 `127.0.0.1:3000` 上长期监听请求。
  *
  * == 启动顺序 ==
  * {{{
  * initializeDatabase  →  apiRoutes.orNotFound  →  EmberServerBuilder.build.use
  * }}}
  * - `initializeDatabase`：连接 PostgreSQL，建表并注入种子数据；
  * - `apiRoutes`：由 [[microservice.routes.ApiRouter]] 组装统一 APIMessage 分发入口；
  * - `IO.never`：server 资源在 `use` 块内永不完成，进程保持存活直至被外部终止。
  *
  * == 与前端的关系 ==
  * Vite 开发服务器（默认 5173）通过 API 客户端访问本端口的统一 `POST /api/{apiName}` 入口。
  * 生产部署时亦应保证 API 网关或反向代理指向同一监听地址。
  *
  * == 关联类型 ==
  * - [[microservice.routes.ApiRouter]]：APIMessage 注册与统一分发入口；
  * - [[microservice.infrastructure.database.DatabaseSession]]：APIMessage 的事务边界；
  * - [[microservice.system.utils.SystemDefaults]]：数据库配置、种子数据、路由工厂。
  */
object Main extends IOApp.Simple {
  override def run: IO[Unit] =
    // 步骤 1：初始化 PostgreSQL 存储（建表 + 种子数据）
    SystemDefaults.initializeDatabase *>
      // 步骤 2：构建并启动 Ember HTTP 服务
      EmberServerBuilder
        .default[IO]
        // 仅绑定本机回环地址，避免开发环境意外暴露到局域网
        .withHost(Host.fromString("127.0.0.1").get)
        // 与前端 vite.config.ts proxy target 及 package.json dev 脚本约定一致
        .withPort(Port.fromInt(3000).get)
        // orNotFound：未匹配路由时返回 404，而非抛出异常
        .withHttpApp(SystemDefaults.apiRoutes.orNotFound)
        .build
        // 步骤 3：持有 server 生命周期；IO.never 使 run 永不正常结束
        .use(_ => IO.never)
}
