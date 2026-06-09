package microservice.level.tables.comment.inmemory

import microservice.level.tables.shared.CommentRow

import microservice.level.tables.comment._

import microservice.infrastructure.database.InMemoryStore

private[tables] object CommentTableInMemory {
  def listAllForAdmin(): Vector[CommentRow] =
    InMemoryStore.comments.sortBy(_.createdAt)(Ordering[String].reverse)

  def listRecentByUser(userId: String, limit: Int): Vector[CommentRow] =
    InMemoryStore.comments
      .filter(_.userId == userId)
      .sortBy(_.createdAt)(Ordering[String].reverse)
      .take(limit)

  def listByLevel(levelId: String): Vector[CommentRow] =
    InMemoryStore.comments
      .filter(_.levelId == levelId)
      .sortBy(_.createdAt)(Ordering[String].reverse)

  def nextId(): String =
    s"comment-${InMemoryStore.comments.size + 1}"

  def insert(row: CommentRow): CommentRow = {
    InMemoryStore.comments = InMemoryStore.comments :+ row
    row
  }

  def deleteById(commentId: String): Option[CommentRow] =
    InMemoryStore.comments.indexWhere(_.id == commentId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.comments(index)
        InMemoryStore.comments = InMemoryStore.comments.patch(index, Nil, 1)
        Some(deleted)
    }
}
