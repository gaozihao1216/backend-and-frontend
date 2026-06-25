package microservice.player.support.checkin

/** 玩家签到默认配置。
  *
  * 定义：动态 UI 中玩家主页签到面板的默认 panelId。
  * 作用：签到领取未传 panelId 时使用同一个默认面板；seed 使用同一 id 初始化奖励。
  */
private[player] object PlayerCheckInDefaults {
  val roleHomeCheckInPanelId: String = "player.home.checkIn"
}
