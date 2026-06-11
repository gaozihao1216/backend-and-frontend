package microservice.level.utils

import microservice.infrastructure.http.HttpError
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelRow}
import microservice.system.objects.LevelStatus
import java.sql.Connection

/** 关卡 API 层公共辅助：封装「已发布关卡」校验逻辑。
  *
  * 实现：查 LevelTable → 校验 status == Published；非发布态统一映射为 LEVEL_NOT_FOUND。
  * 关联：GetPublishedLevel、CreateComment、Favorite/Unfavorite 等玩家侧写/读 API 共用。
  */
object LevelApiSupport {
  /** 按 ID 查找关卡并确保其处于 Published 状态；供玩家侧 API 在操作前校验目标关卡可见性。 */
  def publishedLevel(connection: Connection, levelId: String): Either[HttpError, LevelRow] =
    LevelTable.findById(connection, levelId) match {
      case Some(level) if level.status == LevelStatus.Published => Right(level)
      // 存在但未发布：对外隐藏，与不存在同等处理
      case Some(_) => Left(HttpError.notFound("LEVEL_NOT_FOUND", "Published level not found"))
      case None => Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
    }
}
