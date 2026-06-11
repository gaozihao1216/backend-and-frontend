package microservice.infrastructure.database

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import munit.CatsEffectSuite

/** DatabaseSession 事务语义：Left 不抛异常、Right/Left 正确回传。 */
class DatabaseSessionSuite extends CatsEffectSuite {
  private val config =
    DatabaseConfig(driver = "test", url = "test", schema = "test")

  private val inMemorySession: DatabaseSession =
    DatabaseSession.inMemory(config)

  test("withTransactionEither returns Right on success") {
    inMemorySession
      .withTransactionEither(_ => IO.pure(Right(42)))
      .map(result => assertEquals(result, Right(42)))
  }

  test("withTransactionEither returns Left without raising") {
    val error = HttpError.badRequest("TEST_ERROR", "planned failure")

    inMemorySession
      .withTransactionEither(_ => IO.pure(Left(error)))
      .map(result => assertEquals(result, Left(error)))
  }

  test("withTransactionEither propagates IO failures") {
    val boom = new RuntimeException("connection failed")

    interceptIO[RuntimeException] {
      inMemorySession.withTransactionEither(_ => IO.raiseError(boom))
    }.map(ex => assertEquals(ex.getMessage, "connection failed"))
  }

  test("tracking session commits on Right and rolls back on Left") {
    val session = new TrackingDatabaseSession(config)
    val error = HttpError.badRequest("ROLLBACK", "rollback me")

    for {
      _ <- session.withTransactionEither(_ => IO.pure(Right("ok")))
      _ <- session.withTransactionEither(_ => IO.pure(Left(error)))
    } yield {
      assertEquals(session.events, List("commit", "rollback"))
    }
  }
}

/** 记录 commit/rollback 调用的 test double，模拟 JDBC 事务边界语义。 */
private final class TrackingDatabaseSession(val config: DatabaseConfig) extends DatabaseSession {
  var events: List[String] = Nil

  override val description: String = "tracking-test-session"

  override def withConnection[A](use: java.sql.Connection => IO[A]): IO[A] =
    use(null.asInstanceOf[java.sql.Connection])

  override def withTransaction[A](use: java.sql.Connection => IO[A]): IO[A] =
    withTransactionEither(use(_).map(Right(_))).flatMap {
      case Right(value) => IO.pure(value)
      case Left(error)  => IO.raiseError(new RuntimeException(error.message))
    }

  override def withTransactionEither[A](
      use: java.sql.Connection => IO[Either[HttpError, A]]
  ): IO[Either[HttpError, A]] =
    use(null.asInstanceOf[java.sql.Connection]).flatMap {
      case right @ Right(_) =>
        IO { events = events :+ "commit" }.as(right)
      case left @ Left(_) =>
        IO { events = events :+ "rollback" }.as(left)
    }.handleErrorWith { error =>
      IO { events = events :+ "rollback" } *> IO.raiseError(error)
    }
}
