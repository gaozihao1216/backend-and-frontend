package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.design.BirdDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
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
    * 关联的 HTTP 路由/前端 API：见 routes 中对应路径；前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, List[BirdDesign]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        // 步骤 2：读取并组装数据
        designs <- PlanSteps.read(
          BirdDesignTable
            .listByAuthor(connection, designerId, status)
            .map(BirdRowMapper.toBirdDesign)
            .toList
        )
      // 返回业务结果 DTO/领域对象
      } yield designs
    }
}

/** 删除草稿状态的鸟类设计（仅作者、仅 Draft）。
  *
  * 关联：DELETE /designer/bird-designs/:designId。
  */
final case class DeleteBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        existing <- PlanSteps.require(
          BirdDesignTable.findById(connection, designId) match {
            case None =>
              Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
            case Some(row) if row.authorId != designerId =>
              Left(HttpError.forbidden("Cannot delete another designer's bird design"))
            case Some(row) if row.status != LevelStatus.Draft =>
              Left(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft designs can be deleted"))
            case Some(row) =>
              Right(row)
          }
        )
        design <- PlanSteps.require(
          if (BirdDesignTable.deleteDraft(connection, designId, designerId)) {
            Right(BirdRowMapper.toBirdDesign(existing))
          } else {
            Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be deleted"))
          }
        )
      } yield design
    }
}
