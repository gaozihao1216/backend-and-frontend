package microservice.routes

import cats.effect.IO
import microservice.testsupport.TestSupport
import munit.CatsEffectSuite
import org.http4s._
import org.http4s.implicits._
import org.typelevel.ci._

/** ApiRouter 层：公开路由 vs AuthMiddleware 保护。 */
class ApiRouterAuthSuite extends CatsEffectSuite {
  override def beforeAll(): Unit = {
    TestSupport.seed()
    super.beforeAll()
  }

  private val routes = ApiRouter.routes(TestSupport.session).orNotFound

  test("GET /health is public") {
    routes.run(Request[IO](Method.GET, uri"/health")).map(response => assertEquals(response.status, Status.Ok))
  }

  test("GET /auth/backend-users is public") {
    routes.run(Request[IO](Method.GET, uri"/auth/backend-users")).map(response => assertEquals(response.status, Status.Ok))
  }

  test("GET /admin/comments requires x-user-id") {
    routes.run(Request[IO](Method.GET, uri"/admin/comments")).map(response =>
      assertEquals(response.status, Status.Unauthorized)
    )
  }

  test("GET /admin/director/ui/pages requires x-user-id") {
    routes.run(Request[IO](Method.GET, uri"/admin/director/ui/pages")).map(response =>
      assertEquals(response.status, Status.Unauthorized)
    )
  }

  test("GET /player/levels requires x-user-id") {
    routes.run(Request[IO](Method.GET, uri"/player/levels")).map(response =>
      assertEquals(response.status, Status.Unauthorized)
    )
  }

  test("GET /admin/comments succeeds for standard admin with header") {
    val request =
      Request[IO](Method.GET, uri"/admin/comments")
        .withHeaders(Header.Raw(CIString("x-user-id"), "admin-1"))

    routes.run(request).map(response => assertEquals(response.status, Status.Ok))
  }

  test("GET /admin/director/ui/pages is forbidden for standard admin") {
    val request =
      Request[IO](Method.GET, uri"/admin/director/ui/pages")
        .withHeaders(Header.Raw(CIString("x-user-id"), "admin-1"))

    routes.run(request).map(response => assertEquals(response.status, Status.Forbidden))
  }
}
