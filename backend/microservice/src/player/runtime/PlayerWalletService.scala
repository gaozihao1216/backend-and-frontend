package microservice.player.runtime

import microservice.infrastructure.database.InMemoryStore
import microservice.infrastructure.http.HttpError
import io.circe.Json
import io.circe.syntax._

object PlayerWalletService {
  val dataApiKey: String = "player.wallet"

  def getData(userId: String): Either[HttpError, Json] =
    Right(buildPayload(userId))

  private def buildPayload(userId: String): Json = {
    val wallet = currentWallet(userId)
    Json.obj(
      "coins" -> Json.fromInt(wallet.coins),
      "gems" -> Json.fromInt(wallet.gems),
      "fragments" -> Json.fromInt(wallet.fragments)
    )
  }

  private def currentWallet(userId: String): PlayerWallet =
    InMemoryStore.playerWallets.getOrElse(userId, PlayerWallet(coins = 1280, gems = 96, fragments = 0))
}
