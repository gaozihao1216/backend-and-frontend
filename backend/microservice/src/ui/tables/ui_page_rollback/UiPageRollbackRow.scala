package microservice.ui.tables.ui_page_rollback

import microservice.ui.objects.PageConfig

/** 单页上一版已发布配置，用于总监回滚（每页最多保留一版）。 */
final case class UiPageRollbackRow(
  pageId: String,
  page: PageConfig,
  createdAt: String
)
