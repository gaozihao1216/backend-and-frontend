package microservice.ui.tables

import microservice.ui.objects.{PageComponent, PageLayout, UiEndpoint}

final case class UiPageRow(
  id: String,
  name: String,
  path: String,
  roleScope: UiEndpoint,
  layout: PageLayout,
  components: List[PageComponent],
  createdAt: String,
  updatedAt: String
)
