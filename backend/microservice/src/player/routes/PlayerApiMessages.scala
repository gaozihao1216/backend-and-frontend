package microservice.player.routes

import io.circe.Json
import io.circe.generic.auto._
import microservice.infrastructure.api.RegisteredAPIMessage
import microservice.infrastructure.api.RegisteredAPIMessage.protectedApi
import microservice.player.api.preparation.{
  AscendPreparationBirdAPIMessage,
  GetPreparationStateAPIMessage,
  UpgradePreparationBirdAPIMessage,
  UpgradePreparationSlingshotAPIMessage
}
import microservice.player.api.social.{
  AddFriendAPIMessage,
  ListFriendsAPIMessage,
  ListMessagesAPIMessage,
  SendMessageAPIMessage
}
import microservice.player.api.ui.{GetPlayerUiDataAPIMessage, InvokePlayerUiActionAPIMessage}

object PlayerApiMessages {
  val apiMessages: List[RegisteredAPIMessage] = List(
    protectedApi[GetPlayerUiDataAPIMessage, Json](),
    protectedApi[InvokePlayerUiActionAPIMessage, Json](),
    protectedApi[GetPreparationStateAPIMessage, Json](),
    protectedApi[UpgradePreparationBirdAPIMessage, Json](),
    protectedApi[AscendPreparationBirdAPIMessage, Json](),
    protectedApi[UpgradePreparationSlingshotAPIMessage, Json](),
    protectedApi[ListFriendsAPIMessage, Json](),
    protectedApi[AddFriendAPIMessage, Json](),
    protectedApi[ListMessagesAPIMessage, Json](),
    protectedApi[SendMessageAPIMessage, Json]()
  )
}
