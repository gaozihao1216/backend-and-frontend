package microservice.ui.tables.stretch_visual_template

import microservice.ui.objects.StretchVisualTemplateKind

final case class StretchVisualTemplateRow(
  id: String,
  name: String,
  sourceDataUrl: String,
  kind: StretchVisualTemplateKind,
  category: String,
  createdAt: String,
  updatedAt: String
)
