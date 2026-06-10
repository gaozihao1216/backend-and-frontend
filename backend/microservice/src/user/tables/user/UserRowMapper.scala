package microservice.user.tables.user

import microservice.user.objects.BackendUser

object UserRowMapper {
  def toBackendUser(row: UserRow): BackendUser =
    BackendUser(row.id, row.username, row.displayName, row.role, row.adminLevel, row.createdAt, row.updatedAt)
}
