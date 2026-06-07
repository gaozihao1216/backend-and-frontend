package microservice.ui.tables

import microservice.infrastructure.database.InMemoryStore
import microservice.ui.objects.StretchVisualTemplateKind

private[tables] object StretchVisualTemplateTableInMemory {
  def listByKind(kind: StretchVisualTemplateKind): Vector[StretchVisualTemplateRow] =
    InMemoryStore.stretchVisualTemplates.filter(_.kind == kind).sortBy(_.id)

  def findById(templateId: String): Option[StretchVisualTemplateRow] =
    InMemoryStore.stretchVisualTemplates.find(_.id == templateId)

  def insert(row: StretchVisualTemplateRow): StretchVisualTemplateRow = {
    InMemoryStore.stretchVisualTemplates = InMemoryStore.stretchVisualTemplates :+ row
    row
  }

  def update(row: StretchVisualTemplateRow): Option[StretchVisualTemplateRow] =
    InMemoryStore.stretchVisualTemplates.indexWhere(_.id == row.id) match {
      case -1 => None
      case index =>
        InMemoryStore.stretchVisualTemplates = InMemoryStore.stretchVisualTemplates.updated(index, row)
        Some(row)
    }

  def deleteById(templateId: String): Option[StretchVisualTemplateRow] =
    InMemoryStore.stretchVisualTemplates.indexWhere(_.id == templateId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.stretchVisualTemplates(index)
        InMemoryStore.stretchVisualTemplates = InMemoryStore.stretchVisualTemplates.patch(index, Nil, 1)
        Some(deleted)
    }
}
