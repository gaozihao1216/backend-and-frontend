package coursebackend.services.auth.tables

import coursebackend.services.system.objects.UserRole

final case class UserRow(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  createdAt: String,
  updatedAt: String
)
