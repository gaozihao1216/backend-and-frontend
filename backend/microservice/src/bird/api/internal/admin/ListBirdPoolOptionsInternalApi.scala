package microservice.bird.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.catalog.BirdPoolOptionEntry
import microservice.bird.support.catalog.BirdCatalogReadSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：列出总监 bird pool 全部选项；由 admin HTTP API 调用，不挂路由。 */
final case class ListBirdPoolOptionsInternalAPIMessage() extends APIMessage[List[BirdPoolOptionEntry]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[BirdPoolOptionEntry]]] =
    PlanSteps.finish {
      PlanSteps.read(BirdCatalogReadSupport.listBirdPoolOptions(connection))
    }
}
