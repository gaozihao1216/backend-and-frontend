package microservice.ui.tables.button_template

import microservice.ui.objects.{ButtonTemplateScalingMode, ButtonTemplateSlice}

final case class ButtonTemplateRow(
  id: String,
  name: String,
  sourceDataUrl: String,
  category: String,
  scalingMode: ButtonTemplateScalingMode,
  slice: ButtonTemplateSlice,
  createdAt: String,
  updatedAt: String
)
