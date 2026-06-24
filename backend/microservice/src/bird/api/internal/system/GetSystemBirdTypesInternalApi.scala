package microservice.bird.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.bird.support.catalog.SystemBirdCatalogSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：system 获取内置鸟类型列表；不挂路由。 */
final case class GetSystemBirdTypesInternalAPIMessage() extends APIMessage[Vector[String]] {
  override def plan(connection: Connection): IO[Either[HttpError, Vector[String]]] =
    PlanSteps.finish {
      PlanSteps.read(SystemBirdCatalogSupport.birdTypes)
    }
}
