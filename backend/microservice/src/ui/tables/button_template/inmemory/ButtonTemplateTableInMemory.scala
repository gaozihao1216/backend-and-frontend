package microservice.ui.tables.button_template.inmemory

import microservice.ui.tables.button_template._

import microservice.infrastructure.database.InMemoryStore

private[tables] object ButtonTemplateTableInMemory {
  def listAll(): Vector[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.sortBy(_.id)

  def findById(templateId: String): Option[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.find(_.id == templateId)

  def insert(row: ButtonTemplateRow): ButtonTemplateRow = {
    InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates :+ row
    row
  }

  def update(row: ButtonTemplateRow): Option[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.indexWhere(_.id == row.id) match {
      case -1 => None
      case index =>
        InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates.updated(index, row)
        Some(row)
    }

  def deleteById(templateId: String): Option[ButtonTemplateRow] =
    InMemoryStore.buttonTemplates.indexWhere(_.id == templateId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.buttonTemplates(index)
        InMemoryStore.buttonTemplates = InMemoryStore.buttonTemplates.patch(index, Nil, 1)
        Some(deleted)
    }
}
