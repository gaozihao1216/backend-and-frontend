package microservice.admin.objects.director.level_assignment

/** 总监可分配的关卡槽位后缀白名单（level01–level10）。
  *
  * 领域含义：与玩家侧固定关卡槽位一一对应；仅这些 suffix 可被 Assign/Unassign。
  * 字段：supportedSuffixes 合法槽位列表；isSupported 用于路由参数校验。
  * 关联：GetDirectorLevelAssignmentBoardAPIMessage 等。
  */
private[admin] object LevelSlotCatalog {
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
