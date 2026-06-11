package microservice.infrastructure.http

import cats.effect.IO
import munit.CatsEffectSuite
import org.http4s._
import org.http4s.dsl.io._
import org.http4s.implicits._
import org.typelevel.ci._

/** AuthMiddleware：受保护路由的统一 x-user-id 校验。 */
class AuthMiddlewareSuite extends CatsEffectSuite {
  private val protectedRoutes =
    AuthMiddleware.requireUserId(
      HttpRoutes.of[IO] { case GET -> Root / "protected" => Ok("ok") }
    )

  test("userIdFromRequest reads x-user-id header") {
    val request =
      Request[IO](Method.GET, uri"/protected")
        .withHeaders(Header.Raw(CIString("x-user-id"), "player-1"))

    assertEquals(AuthMiddleware.userIdFromRequest(request), Some("player-1"))
  }

  test("userIdFromRequest ignores blank header") {
    val request =
      Request[IO](Method.GET, uri"/protected")
        .withHeaders(Header.Raw(CIString("x-user-id"), "   "))

    assertEquals(AuthMiddleware.userIdFromRequest(request), None)
  }

  test("requireUserId returns 401 when header is missing") {
    val request = Request[IO](Method.GET, uri"/protected")

    protectedRoutes.orNotFound.run(request).map { response =>
      assertEquals(response.status, Status.Unauthorized)
    }
  }

  test("requireUserId forwards request when header is present") {
    val request =
      Request[IO](Method.GET, uri"/protected")
        .withHeaders(Header.Raw(CIString("x-user-id"), "player-1"))

    protectedRoutes.orNotFound.run(request).flatMap { response =>
      response.as[String].map { body =>
        assertEquals(response.status, Status.Ok)
        assertEquals(body, "ok")
      }
    }
  }
}
