package microservice.infrastructure.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.database.{DatabaseConfig, DatabaseSession}
import microservice.infrastructure.http.HttpError
import microservice.testsupport.TestSupport
import munit.CatsEffectSuite
import org.http4s.Status

/** APIMessage.run 与 withTransactionEither 集成。 */
class APIMessageSuite extends CatsEffectSuite {
  private val session: DatabaseSession =
    DatabaseSession.inMemory(
      DatabaseConfig(driver = "test", url = "test", schema = "test")
    )

  test("APIMessage.run returns Right through withTransactionEither") {
    final case class EchoAPIMessage(value: Int) extends APIMessage[Int] {
      override def plan(connection: Connection): IO[Either[HttpError, Int]] =
        IO.pure(Right(value))
    }

    EchoAPIMessage(7).run(session).map(result => assertEquals(result, Right(7)))
  }

  test("APIMessage.run returns Left without raising") {
    final case class FailAPIMessage() extends APIMessage[String] {
      override def plan(connection: Connection): IO[Either[HttpError, String]] =
        IO.pure(Left(HttpError.notFound("NOT_FOUND", "missing")))
    }

    FailAPIMessage()
      .run(session)
      .map {
        case Left(error) =>
          assertEquals(error.status, Status.NotFound)
          assertEquals(error.code, "NOT_FOUND")
        case Right(_) =>
          fail("expected Left")
      }
  }

  test("APIMessage.run uses seeded in-memory store when requested") {
    TestSupport.seed()

    final case class CountUsersAPIMessage() extends APIMessage[Int] {
      override def plan(connection: Connection): IO[Either[HttpError, Int]] =
        IO.pure(Right(microservice.user.tables.user.UserTable.listAll(connection).size))
    }

    CountUsersAPIMessage()
      .run(TestSupport.session)
      .map {
        case Right(count) => assertEquals(count, 4)
        case Left(error)  => fail(s"expected success, got ${error.code}")
      }
  }
}
