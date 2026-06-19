/** InMemoryStore 上的 按钮模板 CRUD；演示模式与单元测试使用。
  *
  * 关联：UI 定制模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.ui.tables.button_template.inmemory

import microservice.ui.tables.button_template._

import microservice.infrastructure.database.InMemoryStore

/** InMemoryStore 上的按钮模板 CRUD。
  *
  * 关联：ButtonTemplateTable 在 connection == null 时委托到此。
  */
private[tables] object ButtonTemplateTableInMemory {
  /** 返回全部按钮模板行。 */
  def listAll(): Vector[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.sortBy(_.id)

  /** 按 templateId 查找。 */
  def findById(templateId: String): Option[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.find(_.id == templateId)

  /** 追加新按钮模板。 */
  def insert(row: ButtonTemplateRow): ButtonTemplateRow = {
    InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates :+ row
    row
  }

  /** 更新已有按钮模板。 */
  def update(row: ButtonTemplateRow): Option[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.indexWhere(_.id == row.id) match {
      case -1 => None
      case index =>
        InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates.updated(index, row)
        Some(row)
    }

  /** 删除并返回被删行。 */
  def deleteById(templateId: String): Option[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.indexWhere(_.id == templateId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.buttonTemplates(index)
        InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates.patch(index, Nil, 1)
        Some(deleted)
    }
}
