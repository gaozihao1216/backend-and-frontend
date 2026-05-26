package com.example.microservice

import microservice.catalog.MicroserviceApiCatalog

object Main {
  def main(args: Array[String]): Unit =
    println(MicroserviceApiCatalog.summary)
}
