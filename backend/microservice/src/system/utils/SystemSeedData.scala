package microservice.system.utils

import microservice.infrastructure.database.InMemoryStore

/** in-memory 模式的初始演示数据编排入口。
  *
  * 定义：private[utils] object，reset 接收时间戳并写入 InMemoryStore。
  * 问题：空库启动后前端 bind 与浏览需已有用户、关卡、模板等样例。
  * 作用：聚合 SystemDemoData、SystemUiTemplateSeedData、PlayerRuntimeSeed 一次性 reset。
  * 关联：[[SystemDefaults]] 类加载时调用；[[InMemoryStore.reset]] 底层存储。
  */
private[utils] object SystemSeedData {
  /** 重置 in-memory 全局存储：UGC 核心表 + 玩家运行时种子。
    *
    * 定义：传入 createdAt/reviewedAt 时间戳供 demo 行共用。
    * 问题：多次 dev 重启需幂等覆盖而非叠加脏数据。
    * 作用：先 InMemoryStore.reset，再 PlayerRuntimeSeed.reset。
    * 关联：[[SystemDemoData]]、[[PlayerRuntimeSeed]]。
    */
  def reset(createdAt: String, reviewedAt: String): Unit = {
    // --- 1. 写入用户、关卡、评分、评论、提交、UI 模板 ---
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
    // --- 2. 玩家钱包、签到面板、商店等运行时数据 ---
    PlayerRuntimeSeed.reset()
  }
}
