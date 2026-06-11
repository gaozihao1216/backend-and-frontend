package microservice.ui.objects

/** 可拉伸视觉模板：面板背景或装饰图案，含 kind（panel/pattern）与 category。
  *
  * 路由以 /panel-templates 与 /pattern-templates 区分；存储共用 StretchVisualTemplateTable。
  */
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

sealed abstract class StretchVisualTemplateKind(val value: String)

object StretchVisualTemplateKind {
  case object Panel extends StretchVisualTemplateKind("panel")
  case object Pattern extends StretchVisualTemplateKind("pattern")

  val values: List[StretchVisualTemplateKind] = List(Panel, Pattern)

  def fromString(value: String): Option[StretchVisualTemplateKind] =
    values.find(_.value == value)

  implicit val encoder: Encoder[StretchVisualTemplateKind] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[StretchVisualTemplateKind] =
    Decoder.decodeString.emap(value => fromString(value).toRight(s"Unknown stretch visual template kind: $value"))
}

final case class StretchVisualTemplate(
  id: String,
  name: String,
  sourceDataUrl: String,
  kind: StretchVisualTemplateKind,
  category: String,
  createdAt: Option[String],
  updatedAt: Option[String]
)

object StretchVisualTemplate {
  implicit val encoder: Encoder[StretchVisualTemplate] = deriveEncoder
  implicit val decoder: Decoder[StretchVisualTemplate] =
    Decoder.instance { cursor =>
      for {
        id <- cursor.downField("id").as[String]
        name <- cursor.downField("name").as[String]
        sourceDataUrl <- cursor.downField("sourceDataUrl").as[String]
        kind <- cursor.downField("kind").as[StretchVisualTemplateKind]
        category <- cursor.downField("category").as[Option[String]]
        createdAt <- cursor.downField("createdAt").as[Option[String]]
        updatedAt <- cursor.downField("updatedAt").as[Option[String]]
      } yield StretchVisualTemplate(
        id = id,
        name = name,
        sourceDataUrl = sourceDataUrl,
        kind = kind,
        category = category.getOrElse(defaultCategoryForKind(kind)),
        createdAt = createdAt,
        updatedAt = updatedAt
      )
    }

  def defaultCategoryForKind(kind: StretchVisualTemplateKind): String =
    kind match {
      case StretchVisualTemplateKind.Panel   => PanelTemplateCategory.defaultValue
      case StretchVisualTemplateKind.Pattern => PatternTemplateCategory.defaultValue
    }

  def normalizeCategoryForKind(kind: StretchVisualTemplateKind, category: String): String =
    kind match {
      case StretchVisualTemplateKind.Panel if PanelTemplateCategory.isValid(category)   => category
      case StretchVisualTemplateKind.Pattern if PatternTemplateCategory.isValid(category) => category
      case StretchVisualTemplateKind.Panel                                               => PanelTemplateCategory.defaultValue
      case StretchVisualTemplateKind.Pattern                                             => PatternTemplateCategory.defaultValue
    }
}
