package microservice

import microservice.admin.ReviewSubmissionEndpoint
import microservice.auth.BindBackendUserEndpoint
import microservice.core.ApiEndpoint
import microservice.level.{CreateLevelEndpoint, RateLevelEndpoint}
import microservice.user.GetUserProfileEndpoint

object MicroserviceApiCatalog {
  val endpoints: List[ApiEndpoint[_, _]] = List(
    BindBackendUserEndpoint,
    GetUserProfileEndpoint,
    CreateLevelEndpoint,
    RateLevelEndpoint,
    ReviewSubmissionEndpoint
  )

  val summary: String =
    endpoints
      .map(endpoint => s"${endpoint.method.value} ${endpoint.path.value} - ${endpoint.name}")
      .mkString("Scala microservice API contracts:\n", "\n", "")
}
