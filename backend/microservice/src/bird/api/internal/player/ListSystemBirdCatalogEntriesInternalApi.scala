package microservice.bird.api.internal.player

import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.catalog.SystemBirdCatalogEntry
import microservice.bird.support.catalog.BirdCatalogReadSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：列出系统内置鸟 catalog 条目；由 player HTTP API 调用，不挂路由。 */
final case class ListSystemBirdCatalogEntriesInternalAPIMessage() extends APIMessage[List[SystemBirdCatalogEntry]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[SystemBirdCatalogEntry]]] =
    PlanSteps.finish {
      PlanSteps.read(BirdCatalogReadSupport.listSystemEntries)
    }
}
