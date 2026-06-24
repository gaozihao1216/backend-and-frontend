package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.design.BirdDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}

/** 列出当前设计师的鸟类设计，可按 LevelStatus 筛选。
  *
  * 关联：GET /designer/bird-designs?status=。
  */
final case class ListBirdDesignsAPIMessage(
  designerId: String,
  status: Option[LevelStatus]
) extends APIWithTokenMessage[List[BirdDesign]] {
  override def token: String = designerId
  /** plan 定义了什么业务流程：ListBirdDesigns 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的前端 API：前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, List[BirdDesign]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：读取并组装数据
        designs <- PlanSteps.read(
          BirdDesignTable
            .listByAuthor(connection, designerId, status)
            .map(BirdDesignTable.toBirdDesign)
            .toList
        )
      } yield designs
    }
}
