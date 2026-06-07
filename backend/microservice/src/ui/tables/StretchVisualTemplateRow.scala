package microservice.ui.tables

import microservice.ui.objects.StretchVisualTemplateKind

final case class StretchVisualTemplateRow(
  id: String,
  name: String,
  sourceDataUrl: String,
  kind: StretchVisualTemplateKind,
  createdAt: String,
  updatedAt: String
)
