package microservice.catalog

import microservice.contracts.{AdminApi, AuthApi, DesignerApi, PlayerApi, UserApi}
import microservice.framework.ApiEndpoint
import microservice.framework.ApiError

object MicroserviceApiCatalog {
  val endpoints: List[ApiEndpoint[_, _, _ <: ApiError]] = List(
    AuthApi.bindBackendUser,
    UserApi.getUserProfile,
    DesignerApi.createLevel,
    PlayerApi.rateLevel,
    AdminApi.reviewSubmission
  )

  val summary: String = endpoints
    .map(endpoint => s"${endpoint.method.value} ${endpoint.path} - ${endpoint.name}")
    .mkString("Scala microservice API contracts:\n", "\n", "")
}
