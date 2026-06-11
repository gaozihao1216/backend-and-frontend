package microservice.ui.objects

/** 页面组件 ADT：button / panel / text / list 四种类型及其附属配置。
  *
  * 含位置、样式、数据源、绑定与动作；自定义 Circe 编解码按 type 字段分发。
  */
import io.circe.generic.semiauto._
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

final case class PanelFloating(
  anchorComponentId: String,
  placement: String,
  offsetX: Double,
  offsetY: Double
)

object PanelFloating {
  implicit val encoder: Encoder[PanelFloating] = deriveEncoder
  implicit val decoder: Decoder[PanelFloating] = deriveDecoder
}

final case class UiDataSource(
  `type`: String,
  apiKey: Option[String],
  params: Option[Map[String, String]],
  refreshMode: Option[String]
)

object UiDataSource {
  implicit val encoder: Encoder[UiDataSource] = deriveEncoder
  implicit val decoder: Decoder[UiDataSource] = deriveDecoder
}

final case class ComponentBinding(
  text: Option[String],
  visibleWhen: Option[String],
  disabledWhen: Option[String]
)

object ComponentBinding {
  implicit val encoder: Encoder[ComponentBinding] = deriveEncoder
  implicit val decoder: Decoder[ComponentBinding] = deriveDecoder
}

final case class ButtonComponent(
  id: String,
  label: String,
  icon: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  baseDesign: Option[Json],
  imageDesign: Option[Json],
  stateDesign: Option[Json],
  dataSource: Option[UiDataSource],
  binding: Option[ComponentBinding],
  action: ComponentAction
) extends PageComponent {
  override val `type`: String = "button"
}

final case class PanelComponent(
  id: String,
  kind: Option[String],
  panelRole: Option[String],
  title: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  decoration: Option[Json],
  pathDesign: Option[Json],
  contentSize: Option[PanelContentSize],
  floating: Option[PanelFloating],
  dataSource: Option[UiDataSource],
  binding: Option[ComponentBinding],
  childComponentIds: List[String]
) extends PageComponent {
  override val `type`: String = "panel"
}

final case class TextComponent(
  id: String,
  text: String,
  position: ComponentPosition,
  style: Option[ComponentStyle],
  binding: Option[ComponentBinding]
) extends PageComponent {
  override val `type`: String = "text"
}

final case class ListComponent(
  id: String,
  dataPath: String,
  itemTemplate: List[PageComponent],
  emptyStateText: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  binding: Option[ComponentBinding]
) extends PageComponent {
  override val `type`: String = "list"
}

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
