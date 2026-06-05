package microservice.ui.tables

import microservice.ui.objects.ButtonTemplateSlice

final case class ButtonTemplateRow(
  id: String,
  name: String,
  sourceDataUrl: String,
  slice: ButtonTemplateSlice,
  createdAt: String,
  updatedAt: String
)
