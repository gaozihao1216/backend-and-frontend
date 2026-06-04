package microservice.ui.objects

import io.circe.syntax._
import io.circe.{Decoder, DecodingFailure, Encoder, HCursor, Json}

sealed trait PageComponent {
  def id: String
  def `type`: String
  def position: ComponentPosition
  def style: Option[ComponentStyle]
}

final case class PanelContentSize(
  widthPercent: Double,
  heightPercent: Double
)

object PanelContentSize {
  implicit val encoder: Encoder[PanelContentSize] =
    Encoder.forProduct2("widthPercent", "heightPercent")(size => (size.widthPercent, size.heightPercent))

  implicit val decoder: Decoder[PanelContentSize] =
    Decoder.forProduct2("widthPercent", "heightPercent")(PanelContentSize.apply)
}

final case class ButtonComponent(
  id: String,
  label: String,
  icon: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  action: ComponentAction
) extends PageComponent {
  override val `type`: String = "button"
}

final case class PanelComponent(
  id: String,
  kind: Option[String],
  title: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  contentSize: Option[PanelContentSize],
  childComponentIds: List[String]
) extends PageComponent {
  override val `type`: String = "panel"
}

final case class TextComponent(
  id: String,
  text: String,
  position: ComponentPosition,
  style: Option[ComponentStyle]
) extends PageComponent {
  override val `type`: String = "text"
}

object PageComponent {
  implicit val encoder: Encoder[PageComponent] = Encoder.instance {
    case component: ButtonComponent =>
      Json.obj(
        "id" -> component.id.asJson,
        "type" -> Json.fromString(component.`type`),
        "label" -> component.label.asJson,
        "icon" -> component.icon.asJson,
        "position" -> component.position.asJson,
        "style" -> component.style.asJson,
        "action" -> component.action.asJson
      )
    case component: PanelComponent =>
      Json.obj(
        "id" -> component.id.asJson,
        "type" -> Json.fromString(component.`type`),
        "kind" -> component.kind.asJson,
        "title" -> component.title.asJson,
        "position" -> component.position.asJson,
        "style" -> component.style.asJson,
        "contentSize" -> component.contentSize.asJson,
        "childComponentIds" -> component.childComponentIds.asJson
      )
    case component: TextComponent =>
      Json.obj(
        "id" -> component.id.asJson,
        "type" -> Json.fromString(component.`type`),
        "text" -> component.text.asJson,
        "position" -> component.position.asJson,
        "style" -> component.style.asJson
      )
  }

  implicit val decoder: Decoder[PageComponent] = Decoder.instance { cursor: HCursor =>
    cursor.get[String]("type").flatMap {
      case "button" =>
        for {
          id <- cursor.get[String]("id")
          label <- cursor.get[String]("label")
          icon <- cursor.get[Option[String]]("icon")
          position <- cursor.get[ComponentPosition]("position")
          style <- cursor.get[Option[ComponentStyle]]("style")
          action <- cursor.get[ComponentAction]("action")
        } yield ButtonComponent(id, label, icon, position, style, action)
      case "panel" =>
        for {
          id <- cursor.get[String]("id")
          kind <- cursor.get[Option[String]]("kind")
          title <- cursor.get[Option[String]]("title")
          position <- cursor.get[ComponentPosition]("position")
          style <- cursor.get[Option[ComponentStyle]]("style")
          contentSize <- cursor.get[Option[PanelContentSize]]("contentSize")
          childComponentIds <- cursor.get[Option[List[String]]]("childComponentIds").map(_.getOrElse(Nil))
        } yield PanelComponent(id, kind, title, position, style, contentSize, childComponentIds)
      case "text" =>
        for {
          id <- cursor.get[String]("id")
          text <- cursor.get[String]("text")
          position <- cursor.get[ComponentPosition]("position")
          style <- cursor.get[Option[ComponentStyle]]("style")
        } yield TextComponent(id, text, position, style)
      case other =>
        Left(DecodingFailure(s"Unsupported page component type: $other", cursor.history))
    }
  }
}
