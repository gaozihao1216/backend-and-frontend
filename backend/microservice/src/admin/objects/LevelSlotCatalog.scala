package microservice.admin.objects

/** 总监可分配的关卡槽位后缀白名单（level01–level10）。
  *
  * 实现：isSupported 用于 Assign/Unassign/UpdateBirdPool 路由参数校验。
  * 关联：DirectorLevelAssignmentApi；与玩家侧固定关卡槽位一一对应。
  */
object LevelSlotCatalog {
  val supportedSuffixes: List[String] =
    List(
      "level01",
      "level02",
      "level03",
      "level04",
      "level05",
      "level06",
      "level07",
      "level08",
      "level09",
      "level10"
    )

  def isSupported(levelSuffix: String): Boolean =
    supportedSuffixes.contains(levelSuffix)
}
