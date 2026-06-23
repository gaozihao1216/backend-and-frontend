package microservice.ui.tables.ui_page_rollback

import microservice.ui.objects.page.PageConfig

/** UI 页面回滚表在存储层的行模型（与 PostgreSQL ui_page_rollbacks 表列一一对应）。
  *
  * 定义：单页上一版已发布配置的快照，pageId 为主键。
  * 作用：PublishUiPage 覆盖前写入，RollbackUiPage 读取并恢复。
  * 关联：经 UiPageRowMapper 间接关联 PageConfig；不直接作为 API 响应。
  */
final case class UiPageRollbackRow(
  /** 被回滚的页面 id，与 ui_pages.id 对应。 */
  pageId: String,
  /** 上一版完整 PageConfig 快照。 */
  page: PageConfig,
  /** 快照写入时间（ISO-8601 字符串）。 */
  createdAt: String
)
