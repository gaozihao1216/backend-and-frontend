package microservice

import com.comcast.ip4s._
import cats.effect.{IO, IOApp}
import microservice.system.utils.SystemDefaults
import org.http4s.ember.server.EmberServerBuilder

/** 后端进程入口。
  *
  * 实现：启动 http4s Ember 服务，监听 127.0.0.1:3000。
  * 关联：先调用 [[SystemDefaults.initializeDatabase]] 初始化表结构，
  *       再将 [[SystemDefaults.apiRoutes]] 挂载为 HTTP 应用。
  * 前端 Vite 开发服务器通过 proxy 将 API 请求转发到此端口。
  */
object Main extends IOApp.Simple {
  override def run: IO[Unit] =
    // 1. 按当前 DatabaseSession 模式（JDBC 或 in-memory）建表/初始化存储
    SystemDefaults.initializeDatabase *>
      // 2. 启动 HTTP 服务，路由树由 ApiRouter 组装
      EmberServerBuilder
        .default[IO]
        .withHost(Host.fromString("127.0.0.1").get)
        .withPort(Port.fromInt(3000).get)
        .withHttpApp(SystemDefaults.apiRoutes.orNotFound)
        .build
        .use(_ => IO.never)
}
