package microservice.ui.objects.component

import io.circe.syntax._
import io.circe.{Decoder, DecodingFailure, Encoder, HCursor, Json}

/** 页面组件 ADT 根 trait；子类型含 button/panel/text/list。 */
trait PageComponent {
  def id: String
  def `type`: String
  def position: ComponentPosition
  def style: Option[ComponentStyle]
}

/** PageComponent ADT 的自定义 Circe 编解码（按 type 字段分发）。 */
object PageComponent {
  implicit lazy val encoder: Encoder[PageComponent] = Encoder.instance {
    case component: ButtonComponent =>
      Json.obj(
        "id" -> component.id.asJson,
        "type" -> Json.fromString(component.`type`),
        "label" -> component.label.asJson,
        "icon" -> component.icon.asJson,
        "position" -> component.position.asJson,
        "style" -> component.style.asJson,
        "baseDesign" -> component.baseDesign.asJson,
        "imageDesign" -> component.imageDesign.asJson,
        "stateDesign" -> component.stateDesign.asJson,
        "dataSource" -> component.dataSource.asJson,
        "binding" -> component.binding.asJson,
        "action" -> component.action.asJson
      )
    case component: PanelComponent =>
      Json.obj(
        "id" -> component.id.asJson,
        "type" -> Json.fromString(component.`type`),
        "kind" -> component.kind.asJson,
        "panelRole" -> component.panelRole.asJson,
        "title" -> component.title.asJson,
        "position" -> component.position.asJson,
        "style" -> component.style.asJson,
        "decoration" -> component.decoration.asJson,
        "pathDesign" -> component.pathDesign.asJson,
        "contentSize" -> component.contentSize.asJson,
        "floating" -> component.floating.asJson,
        "dataSource" -> component.dataSource.asJson,
        "binding" -> component.binding.asJson,
        "childComponentIds" -> component.childComponentIds.asJson
      )
    case component: TextComponent =>
      Json.obj(
        "id" -> component.id.asJson,
        "type" -> Json.fromString(component.`type`),
        "text" -> component.text.asJson,
        "position" -> component.position.asJson,
        "style" -> component.style.asJson,
        "binding" -> component.binding.asJson
      )
    case component: ListComponent =>
      Json.obj(
        "id" -> component.id.asJson,
        "type" -> Json.fromString(component.`type`),
        "dataPath" -> component.dataPath.asJson,
        "itemTemplate" -> component.itemTemplate.asJson,
        "emptyStateText" -> component.emptyStateText.asJson,
        "position" -> component.position.asJson,
        "style" -> component.style.asJson,
        "binding" -> component.binding.asJson
      )
  }

  implicit lazy val decoder: Decoder[PageComponent] = Decoder.instance { cursor: HCursor =>
    cursor.get[String]("type").flatMap {
      case "button" =>
        for {
          id <- cursor.get[String]("id")
          label <- cursor.get[String]("label")
          icon <- cursor.get[Option[String]]("icon")
          position <- cursor.get[ComponentPosition]("position")
          style <- cursor.get[Option[ComponentStyle]]("style")
          baseDesign <- cursor.get[Option[Json]]("baseDesign")
          imageDesign <- cursor.get[Option[Json]]("imageDesign")
          stateDesign <- cursor.get[Option[Json]]("stateDesign")
          dataSource <- cursor.get[Option[UiDataSource]]("dataSource")
          binding <- cursor.get[Option[ComponentBinding]]("binding")
          action <- cursor.get[ComponentAction]("action")
        } yield ButtonComponent(id, label, icon, position, style, baseDesign, imageDesign, stateDesign, dataSource, binding, action)
      case "panel" =>
        for {
          id <- cursor.get[String]("id")
          kind <- cursor.get[Option[String]]("kind")
          panelRole <- cursor.get[Option[String]]("panelRole")
          title <- cursor.get[Option[String]]("title")
          position <- cursor.get[ComponentPosition]("position")
          style <- cursor.get[Option[ComponentStyle]]("style")
          decoration <- cursor.get[Option[Json]]("decoration")
          pathDesign <- cursor.get[Option[Json]]("pathDesign")
          contentSize <- cursor.get[Option[PanelContentSize]]("contentSize")
          floating <- cursor.get[Option[PanelFloating]]("floating")
          dataSource <- cursor.get[Option[UiDataSource]]("dataSource")
          binding <- cursor.get[Option[ComponentBinding]]("binding")
          childComponentIds <- cursor.get[Option[List[String]]]("childComponentIds").map(_.getOrElse(Nil))
        } yield PanelComponent(id, kind, panelRole, title, position, style, decoration, pathDesign, contentSize, floating, dataSource, binding, childComponentIds)
      case "text" =>
        for {
          id <- cursor.get[String]("id")
          text <- cursor.get[String]("text")
          position <- cursor.get[ComponentPosition]("position")
          style <- cursor.get[Option[ComponentStyle]]("style")
          binding <- cursor.get[Option[ComponentBinding]]("binding")
        } yield TextComponent(id, text, position, style, binding)
      case "list" =>
        for {
          id <- cursor.get[String]("id")
          dataPath <- cursor.get[String]("dataPath")
          itemTemplate <- cursor.get[Option[List[PageComponent]]]("itemTemplate").map(_.getOrElse(Nil))
          emptyStateText <- cursor.get[Option[String]]("emptyStateText")
          position <- cursor.get[ComponentPosition]("position")
          style <- cursor.get[Option[ComponentStyle]]("style")
          binding <- cursor.get[Option[ComponentBinding]]("binding")
        } yield ListComponent(id, dataPath, itemTemplate, emptyStateText, position, style, binding)
      case other =>
        Left(DecodingFailure(s"Unsupported page component type: $other", cursor.history))
    }
  }
}
