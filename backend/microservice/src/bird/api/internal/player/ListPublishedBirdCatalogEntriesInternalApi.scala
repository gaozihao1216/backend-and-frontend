package microservice.bird.api.internal.player

import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.catalog.PublishedBirdCatalogEntry
import microservice.bird.support.catalog.PublishedBirdCatalogSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：列出已发布鸟类设计目录条目；由 player HTTP API 调用，不挂路由。 */
final case class ListPublishedBirdCatalogEntriesInternalAPIMessage() extends APIMessage[List[PublishedBirdCatalogEntry]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[PublishedBirdCatalogEntry]]] =
    PlanSteps.finish {
      PlanSteps.read(PublishedBirdCatalogSupport.listPublished(connection))
    }
}
