package microservice.ui.objects

/** 按钮视觉模板：源图 URL、缩放模式（固定比例/九宫格）与 slice 边距。
  *
  * 总监在 DirectorWorkbench 管理；ButtonComponent 的 baseDesign 可引用 templateId。
  */
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 按钮模板缩放模式：固定比例或九宫格。 */
sealed abstract class ButtonTemplateScalingMode(val value: String)

/** ButtonTemplateScalingMode 枚举与编解码。 */
object ButtonTemplateScalingMode {
  case object FixedAspect extends ButtonTemplateScalingMode("fixedAspect")
  case object NineSlice extends ButtonTemplateScalingMode("nineSlice")

  val values: List[ButtonTemplateScalingMode] = List(FixedAspect, NineSlice)

  /** 从字符串解析缩放模式。 */
  def fromString(value: String): Option[ButtonTemplateScalingMode] =
    values.find(_.value == value)

  implicit val encoder: Encoder[ButtonTemplateScalingMode] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[ButtonTemplateScalingMode] =
    Decoder.decodeString.emap(value => fromString(value).toRight(s"Unknown button template scaling mode: $value"))
}

/** 九宫格切片边距（top/right/bottom/left）。 */
final case class ButtonTemplateSlice(
  top: Double,
  right: Double,
  bottom: Double,
  left: Double
)

/** ButtonTemplateSlice 编解码。 */
object ButtonTemplateSlice {
  implicit val encoder: Encoder[ButtonTemplateSlice] = deriveEncoder
  implicit val decoder: Decoder[ButtonTemplateSlice] = deriveDecoder
}

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
object ButtonTemplate {
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
