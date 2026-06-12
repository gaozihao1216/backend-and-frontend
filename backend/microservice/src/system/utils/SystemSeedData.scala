package microservice.system.utils

import microservice.infrastructure.database.InMemoryStore

/** in-memory 模式的初始演示数据。 */
private[utils] object SystemSeedData {
  def reset(createdAt: String, reviewedAt: String): Unit = {
    InMemoryStore.reset(
      nextUsers = SystemDemoData.users(createdAt),
      nextLevels = SystemDemoData.levels(createdAt),
      nextRatings = SystemDemoData.ratings(createdAt),
      nextComments = SystemDemoData.comments(createdAt),
      nextFavorites = Vector.empty,
      nextSubmissions = SystemDemoData.submissions(createdAt, reviewedAt),
      nextButtonTemplates = SystemUiTemplateSeedData.buttonTemplates(createdAt),
      nextStretchVisualTemplates = SystemUiTemplateSeedData.stretchVisualTemplates(createdAt)
    )
    PlayerRuntimeSeed.reset()
  }
}
