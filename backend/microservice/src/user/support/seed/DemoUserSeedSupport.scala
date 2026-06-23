package microservice.user.support.seed

import microservice.system.objects.{AdminLevel, UserRole}
import microservice.user.tables.user.UserRow

/** 演示用户种子（user 模块内）。 */
object DemoUserSeedSupport {
  def users(createdAt: String): Vector[UserRow] =
    Vector(
      UserRow("player-1", "local-player-0000001", "Player One", UserRole.Player, None, createdAt, createdAt),
      UserRow("designer-1", "local-designer-0000002", "Designer One", UserRole.Designer, None, createdAt, createdAt),
      UserRow("admin-1", "local-admin-0000003", "Admin One", UserRole.Admin, Some(AdminLevel.Standard), createdAt, createdAt),
      UserRow("admin-director-1", "001", "001", UserRole.Admin, Some(AdminLevel.Director), createdAt, createdAt)
    )
}
