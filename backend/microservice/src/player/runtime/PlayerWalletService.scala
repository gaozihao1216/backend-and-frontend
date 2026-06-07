package microservice.player.runtime

import microservice.infrastructure.http.HttpError
import microservice.player.tables.PlayerWalletTable
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection

object PlayerWalletService {
  val dataApiKey: String = "player.wallet"

  def getData(connection: Connection, userId: String): Either[HttpError, Json] =
    Right(buildPayload(connection, userId))

  private def buildPayload(connection: Connection, userId: String): Json = {
    val wallet = PlayerWalletTable.getOrCreate(connection, userId)
    Json.obj(
      "coins" -> Json.fromInt(wallet.coins),
      "gems" -> Json.fromInt(wallet.gems),
      "fragments" -> Json.fromInt(wallet.fragments)
    )
  }
}
