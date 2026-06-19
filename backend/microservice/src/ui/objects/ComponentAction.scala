package microservice.ui.objects

/** 组件交互动作 ADT：导航、开关面板/弹窗、调用运行时 apiKey、无操作等。
  *
  * ApiAction 可链式 afterSuccess；与 player/api/ui 中 action apiKey 对应。
  */
import io.circe.syntax._
import io.circe.{Decoder, DecodingFailure, Encoder, HCursor, Json}

/** 组件交互动作 ADT 根 trait。 */
sealed trait ComponentAction {
  def `type`: String
}

/** 导航动作：跳转到 targetPageId/targetPath。 */
final case class NavigateAction(
  targetPageId: String,
  targetPath: String
) extends ComponentAction {
  override val `type`: String = "navigate"
}

/** 打开面板动作。 */
final case class OpenPanelAction(
  panelId: String
) extends ComponentAction {
  override val `type`: String = "openPanel"
}

/** 打开弹窗动作。 */
final case class OpenModalAction(
  modalId: String
) extends ComponentAction {
  override val `type`: String = "openModal"
}

/** 调用运行时 apiKey；可链式 afterSuccess。 */
final case class ApiAction(
  apiKey: String,
  params: Option[Map[String, String]],
  afterSuccess: Option[ComponentAction]
) extends ComponentAction {
  override val `type`: String = "apiAction"
}

/** 关闭面板动作；panelId 可选。 */
final case class ClosePanelAction(
  panelId: Option[String]
) extends ComponentAction {
  override val `type`: String = "closePanel"
}

/** 无操作占位动作。 */
case object NoopAction extends ComponentAction {
  override val `type`: String = "none"
}

/** ComponentAction ADT 自定义 Circe 编解码。 */
object ComponentAction {
  implicit lazy val encoder: Encoder[ComponentAction] = Encoder.instance {
    case action: NavigateAction =>
      Json.obj(
        "type" -> Json.fromString(action.`type`),
        "targetPageId" -> action.targetPageId.asJson,
        "targetPath" -> action.targetPath.asJson
      )
    case action: OpenPanelAction =>
      Json.obj(
        "type" -> Json.fromString(action.`type`),
        "panelId" -> action.panelId.asJson
      )
    case action: OpenModalAction =>
      Json.obj(
        "type" -> Json.fromString(action.`type`),
        "modalId" -> action.modalId.asJson
      )
    case action: ApiAction =>
      Json.obj(
        "type" -> Json.fromString(action.`type`),
        "apiKey" -> action.apiKey.asJson,
        "params" -> action.params.asJson,
        "afterSuccess" -> action.afterSuccess.asJson
      )
    case action: ClosePanelAction =>
      Json.obj(
        "type" -> Json.fromString(action.`type`),
        "panelId" -> action.panelId.asJson
      )
    case NoopAction =>
      Json.obj("type" -> Json.fromString(NoopAction.`type`))
  }

  implicit lazy val decoder: Decoder[ComponentAction] = Decoder.instance { cursor: HCursor =>
    cursor.get[String]("type").flatMap {
      case "navigate" =>
        for {
          targetPageId <- cursor.get[String]("targetPageId")
          targetPath <- cursor.get[String]("targetPath")
        } yield NavigateAction(targetPageId, targetPath)
      case "openPanel" =>
        cursor.get[String]("panelId").map(OpenPanelAction.apply)
      case "openModal" =>
        cursor.get[String]("modalId").map(OpenModalAction.apply)
      case "apiAction" =>
        for {
          apiKey <- cursor.get[String]("apiKey")
          params <- cursor.get[Option[Map[String, String]]]("params")
          afterSuccess <- cursor.get[Option[ComponentAction]]("afterSuccess")
        } yield ApiAction(apiKey, params, afterSuccess)
      case "closePanel" =>
        cursor.get[Option[String]]("panelId").map(ClosePanelAction.apply)
      case "none" =>
        Right(NoopAction)
      case other =>
        Left(DecodingFailure(s"Unsupported component action type: $other", cursor.history))
    }
  }
}
