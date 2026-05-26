package microservice.core

sealed trait HttpMethod {
  def value: String
}

case object GET extends HttpMethod {
  override val value: String = "GET"
}

case object POST extends HttpMethod {
  override val value: String = "POST"
}

case object PUT extends HttpMethod {
  override val value: String = "PUT"
}

case object DELETE extends HttpMethod {
  override val value: String = "DELETE"
}
