package microservice.admin.api.comments

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.system.objects.AdminLevel

/** 获取全部关卡评论列表 APIMessage，供 Standard 管理员在后台浏览与删除。 */
final case class GetAdminCommentsAPIMessage(userId: String) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员拉取系统中全部玩家评论，用于审核/清理。
    *
    * 解决了什么问题：后台需要一次性查看所有关卡评论，而非按关卡分页查询。
    * 在事务内起到什么作用：只读查询 CommentTable，无写入；权限失败则整笔回滚（无副作用）。
    * 关联的 HTTP 路由/前端 API：GET /admin/comments；前端 `GetAdminCommentsApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Standard 及以上管理员
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        // 步骤 2：读取全部评论 Row 并映射为领域对象 LevelComment
        comments <- PlanSteps.read(CommentTable.listAllForAdmin(connection).map(LevelRowMapper.toComment).toList)
      // 返回评论列表，供 Admin 评论管理页渲染
      } yield comments
    }
}
