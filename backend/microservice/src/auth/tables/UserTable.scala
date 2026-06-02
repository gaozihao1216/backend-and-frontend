package microservice.auth.tables

import microservice.system.objects.UserRole

final case class UserRow(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  createdAt: String,
  updatedAt: String
)
