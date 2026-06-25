package microservice.ui.routes

import io.circe.Json
import io.circe.generic.auto._
import microservice.infrastructure.api.RegisteredAPIMessage
import microservice.infrastructure.api.RegisteredAPIMessage.protectedApi
import microservice.ui.api.buttontemplates.{
  CreateButtonTemplateAPIMessage,
  DeleteButtonTemplateAPIMessage,
  GetButtonTemplateAPIMessage,
  ListButtonTemplatesAPIMessage,
  UpdateButtonTemplateAPIMessage
}
import microservice.ui.api.pagecomponents.{
  CreatePageComponentAPIMessage,
  DeletePageComponentAPIMessage,
  UpdatePageComponentAPIMessage
}
import microservice.ui.api.pages.management.{
  CreateUiPageAPIMessage,
  DeleteUiPageAPIMessage,
  GetUiPageAPIMessage,
  ListUiPagesAPIMessage,
  UpdateUiPageAPIMessage
}
import microservice.ui.api.pages.publishing.{PublishUiPageAPIMessage, RollbackUiPageAPIMessage}
import microservice.ui.api.pages.runtime.{GetPlayerUiPageAPIMessage, GetSharedLevelMapPageAPIMessage}
import microservice.ui.api.panelworkflows.RegisterCheckInPanelRewardsAPIMessage
import microservice.ui.api.stretchtemplates.{
  CreateStretchVisualTemplateAPIMessage,
  DeleteStretchVisualTemplateAPIMessage,
  ListStretchVisualTemplatesAPIMessage,
  UpdateStretchVisualTemplateAPIMessage
}
import microservice.ui.objects.button_template.ButtonTemplate
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import org.http4s.Status

object UiApiMessages {
  val apiMessages: List[RegisteredAPIMessage] = List(
    protectedApi[ListUiPagesAPIMessage, List[PageConfig]](),
    protectedApi[GetUiPageAPIMessage, PageConfig](),
    protectedApi[CreateUiPageAPIMessage, PageConfig](successStatus = Status.Created),
    protectedApi[UpdateUiPageAPIMessage, PageConfig](),
    protectedApi[PublishUiPageAPIMessage, PageConfig](),
    protectedApi[RollbackUiPageAPIMessage, PageConfig](),
    protectedApi[DeleteUiPageAPIMessage, PageConfig](),
    protectedApi[GetSharedLevelMapPageAPIMessage, PageConfig](),
    protectedApi[GetPlayerUiPageAPIMessage, PageConfig](),
    protectedApi[ListButtonTemplatesAPIMessage, List[ButtonTemplate]](),
    protectedApi[GetButtonTemplateAPIMessage, ButtonTemplate](),
    protectedApi[CreateButtonTemplateAPIMessage, ButtonTemplate](successStatus = Status.Created),
    protectedApi[UpdateButtonTemplateAPIMessage, ButtonTemplate](),
    protectedApi[DeleteButtonTemplateAPIMessage, ButtonTemplate](),
    protectedApi[ListStretchVisualTemplatesAPIMessage, List[StretchVisualTemplate]](),
    protectedApi[CreateStretchVisualTemplateAPIMessage, StretchVisualTemplate](successStatus = Status.Created),
    protectedApi[UpdateStretchVisualTemplateAPIMessage, StretchVisualTemplate](),
    protectedApi[DeleteStretchVisualTemplateAPIMessage, StretchVisualTemplate](),
    protectedApi[CreatePageComponentAPIMessage, PageConfig](successStatus = Status.Created),
    protectedApi[UpdatePageComponentAPIMessage, PageConfig](),
    protectedApi[DeletePageComponentAPIMessage, PageConfig](),
    protectedApi[RegisterCheckInPanelRewardsAPIMessage, Json]()
  )
}
