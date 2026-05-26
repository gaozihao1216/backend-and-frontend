package com.example.microservice

import microservice.MicroserviceApiCatalog

object Main {
  def main(args: Array[String]): Unit =
    println(MicroserviceApiCatalog.summary)
}
