package microservice.ui.objects.stretch_template

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.category.{PanelTemplateCategory, PatternTemplateCategory}

/** 拉伸视觉模板领域对象。 */
final case class StretchVisualTemplate(
  id: String,
  name: String,
  sourceDataUrl: String,
  kind: StretchVisualTemplateKind,
  category: String,
  createdAt: Option[String],
  updatedAt: Option[String]
)

/** StretchVisualTemplate 编解码与 category 规范化辅助方法。 */
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

  /** 按 kind 返回默认 category。 */
  def defaultCategoryForKind(kind: StretchVisualTemplateKind): String =
    kind match {
      case StretchVisualTemplateKind.Panel   => PanelTemplateCategory.defaultValue
      case StretchVisualTemplateKind.Pattern => PatternTemplateCategory.defaultValue
    }

  /** 校验 category 合法性，非法时回退默认值。 */
  def normalizeCategoryForKind(kind: StretchVisualTemplateKind, category: String): String =
    kind match {
      case StretchVisualTemplateKind.Panel if PanelTemplateCategory.isValid(category)   => category
      case StretchVisualTemplateKind.Pattern if PatternTemplateCategory.isValid(category) => category
      case StretchVisualTemplateKind.Panel                                               => PanelTemplateCategory.defaultValue
      case StretchVisualTemplateKind.Pattern                                             => PatternTemplateCategory.defaultValue
    }
}
