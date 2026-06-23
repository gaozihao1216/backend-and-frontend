package microservice.ui.objects.button_template

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.category.ButtonTemplateCategory

/** 按钮视觉模板领域对象。 */
final case class ButtonTemplate(
  id: String,
  name: String,
  sourceDataUrl: String,
  category: String,
  scalingMode: ButtonTemplateScalingMode,
  slice: ButtonTemplateSlice,
  createdAt: Option[String],
  updatedAt: Option[String]
)

/** ButtonTemplate 编解码（category/scalingMode 含默认值）。 */
private[ui] object ButtonTemplate {
  implicit val encoder: Encoder[ButtonTemplate] = deriveEncoder
  implicit val decoder: Decoder[ButtonTemplate] =
    Decoder.instance { cursor =>
      for {
        id <- cursor.downField("id").as[String]
        name <- cursor.downField("name").as[String]
        sourceDataUrl <- cursor.downField("sourceDataUrl").as[String]
        category <- cursor.downField("category").as[Option[String]].map(_.getOrElse(ButtonTemplateCategory.defaultValue))
        scalingMode <- cursor.downField("scalingMode").as[Option[ButtonTemplateScalingMode]].map(_.getOrElse(ButtonTemplateScalingMode.FixedAspect))
        slice <- cursor.downField("slice").as[ButtonTemplateSlice]
        createdAt <- cursor.downField("createdAt").as[Option[String]]
        updatedAt <- cursor.downField("updatedAt").as[Option[String]]
      } yield ButtonTemplate(
        id = id,
        name = name,
        sourceDataUrl = sourceDataUrl,
        category = category,
        scalingMode = scalingMode,
        slice = slice,
        createdAt = createdAt,
        updatedAt = updatedAt
      )
    }
}
