package microservice.ui.tables.ui_page

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
