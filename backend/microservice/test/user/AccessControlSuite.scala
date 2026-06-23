package microservice.user.utils

import munit.FunSuite
import org.http4s.Status

class AccessControlSuite extends FunSuite {
  test("requireBoundIdentity accepts matching ids") {
    AccessControl.checkBoundIdentity("player-1", "player-1") match {
      case Right(()) => ()
      case Left(error) => fail(s"expected Right, got $error")
    }
  }

  test("requireBoundIdentity rejects mismatch") {
    AccessControl.checkBoundIdentity("player-1", "player-2") match {
      case Left(error) =>
        assertEquals(error.status, Status.Forbidden)
        assertEquals(error.code, "USER_ID_MISMATCH")
      case Right(_) =>
        fail("expected Left")
    }
  }

  test("requireBoundIdentity rejects empty identity") {
    AccessControl.checkBoundIdentity("", "player-1") match {
      case Left(error) => assertEquals(error.status, Status.Unauthorized)
      case Right(_)      => fail("expected Left")
    }
  }
}
