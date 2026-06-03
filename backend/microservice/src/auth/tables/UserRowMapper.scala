package microservice.auth.tables

import microservice.auth.objects.BackendUser

object UserRowMapper {
  def toBackendUser(row: UserRow): BackendUser =
    BackendUser(row.id, row.username, row.displayName, row.role, row.adminLevel, row.createdAt, row.updatedAt)
}
