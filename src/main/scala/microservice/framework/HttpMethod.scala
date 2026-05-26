package microservice.framework

sealed trait HttpMethod {
  def value: String
}

object HttpMethod {
  case object Get extends HttpMethod {
    override val value: String = "GET"
  }

  case object Post extends HttpMethod {
    override val value: String = "POST"
  }

  case object Delete extends HttpMethod {
    override val value: String = "DELETE"
  }
}
