package microservice.system.utils

import microservice.infrastructure.database.InMemoryStore
import microservice.bird.support.catalog.SystemBirdCatalogSupport
import microservice.level.support.seed.DemoLevelSeedSupport
import microservice.player.support.seed.PlayerRuntimeSeedSupport
import microservice.ui.support.seed.DemoUiTemplateSeedSupport
import microservice.user.support.seed.DemoUserSeedSupport

/** in-memory 模式的初始演示数据编排入口。 */
private[utils] object SystemSeedData {
  def reset(createdAt: String, reviewedAt: String): Unit = {
    InMemoryStore.reset(
      nextUsers = DemoUserSeedSupport.users(createdAt),
      nextLevels = DemoLevelSeedSupport.levels(createdAt),
      nextRatings = DemoLevelSeedSupport.ratings(createdAt),
      nextComments = DemoLevelSeedSupport.comments(createdAt),
      nextFavorites = Vector.empty,
      nextSubmissions = DemoLevelSeedSupport.submissions(createdAt, reviewedAt),
      nextButtonTemplates = DemoUiTemplateSeedSupport.buttonTemplates(createdAt),
      nextStretchVisualTemplates = DemoUiTemplateSeedSupport.stretchVisualTemplates(createdAt)
    )
    PlayerRuntimeSeedSupport.resetInMemory(SystemBirdCatalogSupport.birdTypes)
  }
}
