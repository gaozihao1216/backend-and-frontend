package microservice.admin

import microservice.admin.api.comments.GetAdminCommentsAPIMessage
import microservice.admin.api.director.level_assignment.GetDirectorLevelAssignmentBoardAPIMessage
import microservice.admin.api.director.permissions.GetDirectorPermissionsAPIMessage
import microservice.admin.api.submissions.GetPendingSubmissionsAPIMessage
import microservice.bird.api.review.GetPendingBirdSubmissionsAPIMessage
import microservice.testsupport.TestSupport
import microservice.ui.api.pages.ListUiPagesAPIMessage
import munit.CatsEffectSuite
import org.http4s.Status

/** Standard / Director 管理员权限隔离。 */
class AdminAccessControlSuite extends CatsEffectSuite {
  override def beforeAll(): Unit = {
    TestSupport.seed()
    super.beforeAll()
  }

  test("standard admin can list comments") {
    GetAdminCommentsAPIMessage("admin-1")
      .run(TestSupport.session)
      .map {
        case Right(comments) => assert(comments.nonEmpty)
        case Left(error)     => fail(s"expected success, got ${error.code}")
      }
  }

  test("director admin cannot list standard comment admin api") {
    GetAdminCommentsAPIMessage("admin-director-1")
      .run(TestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("director should not access standard admin comment api")
      }
  }

  test("standard admin cannot read director permissions") {
    GetDirectorPermissionsAPIMessage("admin-1")
      .run(TestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("standard admin should not access director permissions")
      }
  }

  test("director admin can read director permissions") {
    GetDirectorPermissionsAPIMessage("admin-director-1")
      .run(TestSupport.session)
      .map {
        case Right(summary) =>
          assertEquals(summary.userId, "admin-director-1")
          assert(summary.canManageUiCustomization)
        case Left(error) => fail(s"expected success, got ${error.code}")
      }
  }

  test("standard admin cannot open director level assignment board") {
    GetDirectorLevelAssignmentBoardAPIMessage("admin-1")
      .run(TestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("standard admin should not access director level board")
      }
  }

  test("standard admin cannot list director ui pages") {
    ListUiPagesAPIMessage("admin-1", endpoint = None)
      .run(TestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("standard admin should not access ui customization")
      }
  }

  test("standard admin can list pending submissions") {
    GetPendingSubmissionsAPIMessage("admin-1")
      .run(TestSupport.session)
      .map {
        case Right(submissions) => assert(submissions.nonEmpty)
        case Left(error)        => fail(s"expected success, got ${error.code}")
      }
  }

  test("director admin cannot list pending submissions") {
    GetPendingSubmissionsAPIMessage("admin-director-1")
      .run(TestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("director should not access standard submission review api")
      }
  }

  test("director admin cannot list pending bird submissions") {
    GetPendingBirdSubmissionsAPIMessage("admin-director-1")
      .run(TestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("director should not access standard bird submission review api")
      }
  }

  test("player cannot list admin comments") {
    GetAdminCommentsAPIMessage("player-1")
      .run(TestSupport.session)
      .map {
        case Left(error) => assertEquals(error.status, Status.Forbidden)
        case Right(_)    => fail("player should not access admin comments")
      }
  }
}
