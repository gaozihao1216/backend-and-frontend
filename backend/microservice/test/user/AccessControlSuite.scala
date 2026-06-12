package microservice.user.utils

import munit.FunSuite
import org.http4s.Status

class AccessControlSuite extends FunSuite {
  test("requireBoundIdentity accepts matching ids") {
    assertEquals(AccessControl.requireBoundIdentity("player-1", "player-1"), Right(()))
  }

  test("requireBoundIdentity rejects mismatch") {
    AccessControl.requireBoundIdentity("player-1", "player-2") match {
      case Left(error) =>
        assertEquals(error.status, Status.Forbidden)
        assertEquals(error.code, "USER_ID_MISMATCH")
      case Right(_) =>
        fail("expected Left")
    }
  }

  test("requireBoundIdentity rejects empty identity") {
    AccessControl.requireBoundIdentity("", "player-1") match {
      case Left(error) => assertEquals(error.status, Status.Unauthorized)
      case Right(_)      => fail("expected Left")
    }
  }
}
