package microservice.infrastructure.api

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.testsupport.TestSupport
import munit.CatsEffectSuite
import org.http4s.Status

/** PlanSteps 组合器：require 短路、read/blocking 顺序执行。 */
class PlanStepsSuite extends CatsEffectSuite {
  test("require short-circuits later steps on Left") {
    var readCalls = 0

    val resultIO: IO[Either[HttpError, String]] = PlanSteps.finish {
      for {
        _ <- PlanSteps.require[Unit](Left(HttpError.badRequest("STEP_FAILED", "stop here")))
        _ <- PlanSteps.read {
          readCalls += 1
          ()
        }
      } yield "unused"
    }

    resultIO.map { result =>
      assertEquals(result, Left(HttpError.badRequest("STEP_FAILED", "stop here")))
      assertEquals(readCalls, 0)
    }
  }

  test("read and require compose on success path") {
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(Right(()))
        a <- PlanSteps.read(1 + 2)
        b <- PlanSteps.read(a * 2)
      } yield b
    }.map(result => assertEquals(result, Right(6)))
  }

  test("blocking runs inside IO.blocking") {
    PlanSteps.finish {
      for {
        value <- PlanSteps.blocking(40 + 2)
      } yield value
    }.map(result => assertEquals(result, Right(42)))
  }

  test("requireBound rejects mismatched header and token") {
    PlanSteps.finish {
      for {
        _ <- PlanSteps.requireBound("player-1", "player-2")
        _ <- PlanSteps.read[Unit](())
      } yield ()
    }.map {
      case Left(error: HttpError) =>
        assertEquals(error.status, Status.Forbidden)
        assertEquals(error.code, "USER_ID_MISMATCH")
      case Right(_) =>
        fail("expected Left")
      case Left(_) =>
        fail("expected HttpError")
    }
  }

  test("APIWithTokenMessage.runAuthenticated rejects identity mismatch before plan") {
    TestSupport.seed()

    final case class EchoTokenAPIMessage(userId: String) extends APIWithTokenMessage[Int] {
      override def token: String = userId

      override def plan(connection: java.sql.Connection): IO[Either[HttpError, Int]] =
        PlanSteps.finish(PlanSteps.read(99))
    }

    EchoTokenAPIMessage("player-1")
      .runAuthenticated("player-2", TestSupport.session)
      .map {
        case Left(error) =>
          assertEquals(error.code, "USER_ID_MISMATCH")
        case Right(_) =>
          fail("expected mismatch rejection")
      }
  }
}
