package microservice.ui.tables

import microservice.ui.objects.{ButtonTemplateScalingMode, ButtonTemplateSlice}

final case class ButtonTemplateRow(
  id: String,
  name: String,
  sourceDataUrl: String,
  scalingMode: ButtonTemplateScalingMode,
  slice: ButtonTemplateSlice,
  createdAt: String,
  updatedAt: String
)
