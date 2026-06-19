package microservice.ui.objects

/** 共享关卡地图页的固定 pageId（总监预置，玩家只读）。 */
/** 共享关卡地图页的固定 pageId 常量。
  *
  * 定义：总监预置页面，玩家通过 GetSharedLevelMapPage 只读访问。
  * 关联：GetSharedLevelMapPageAPIMessage。
  */
object SharedLevelMapPageId {
  /** 固定 pageId 字符串。 */
  val value: String = "shared.levelMap"
}
