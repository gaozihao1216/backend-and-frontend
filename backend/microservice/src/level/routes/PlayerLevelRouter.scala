package microservice.level.routes

import cats.effect.IO
import cats.syntax.semigroupk._
import microservice.infrastructure.database.DatabaseSession
import org.http4s.HttpRoutes

object PlayerLevelRouter {
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    PlayerLevelReadRouter.routes(databaseSession) <+> PlayerLevelActionRouter.routes(databaseSession)
}
