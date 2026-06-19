package microservice.infrastructure.jdbc

import microservice.admin.api.submissions.GetPendingSubmissionsAPIMessage
import microservice.level.api.GetPublishedLevelsAPIMessage
import microservice.system.api.HealthAPIMessage
import microservice.system.utils.SystemDefaults
import microservice.testsupport.JdbcTestSupport
import microservice.user.api.GetBackendUsersAPIMessage
import munit.CatsEffectSuite
import org.http4s.Status

/** PostgreSQL/JDBC 模式冒烟测试；本地或 CI 需设置 UGC_DATABASE_MODE=jdbc 并提供数据库。 */
class JdbcSmokeSuite extends CatsEffectSuite {
  override def munitTests() =
    if (JdbcTestSupport.enabled) super.munitTests
    else Nil

  override def beforeAll(): Unit = {
    if (JdbcTestSupport.enabled) {
      SystemDefaults.initializeDatabaseOn(JdbcTestSupport.session).unsafeRunSync()
    }
    super.beforeAll()
  }

  test("initializeDatabaseOn succeeds against postgres") {
    SystemDefaults.initializeDatabaseOn(JdbcTestSupport.session).map(_ => ())
  }

  test("health check runs through jdbc session") {
    HealthAPIMessage()
      .run(JdbcTestSupport.session)
      .map(result => assertEquals(result, Right(microservice.system.objects.HealthResponse("ok"))))
  }

  test("seeded backend users are readable over jdbc") {
    GetBackendUsersAPIMessage()
      .run(JdbcTestSupport.session)
      .map {
        case Right(users) => assert(users.exists(_.id == "player-1"))
        case Left(error)  => fail(s"expected backend users, got ${error.code}")
      }
  }

  test("standard admin can list pending submissions over jdbc") {
    GetPendingSubmissionsAPIMessage("admin-1")
      .run(JdbcTestSupport.session)
      .map {
        case Right(submissions) =>
          assert(submissions.exists(_.id == "submission-2"))
        case Left(error) => fail(s"expected success, got ${error.code}: ${error.message}")
      }
  }

  test("jdbc demo seed exposes published level to player") {
    GetPublishedLevelsAPIMessage("player-1", tag = None, sort = "newest")
      .run(JdbcTestSupport.session)
      .map {
        case Right(levels) => assert(levels.exists(_.id == "level-1"))
        case Left(error)   => fail(s"expected published levels, got ${error.code}: ${error.message}")
      }
  }

  test("runAuthenticated rejects header/token mismatch over jdbc") {
    GetPendingSubmissionsAPIMessage("admin-1")
      .runAuthenticated("admin-director-1", JdbcTestSupport.session)
      .map {
        case Left(error) => assertEquals(error.code, "USER_ID_MISMATCH")
        case Right(_)    => fail("expected identity mismatch")
      }
  }

  test("director admin cannot list pending submissions over jdbc") {
    GetPendingSubmissionsAPIMessage("admin-director-1")
      .run(JdbcTestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("director should not access standard submission review api")
      }
  }
}
