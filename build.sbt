ThisBuild / scalaVersion := "2.13.16"
ThisBuild / version := "0.1.0"
ThisBuild / organization := "com.example"

lazy val root = (project in file("."))
  .settings(
    name := "UserService",
    Compile / scalaSource := baseDirectory.value / "backend" / "microservice",
    libraryDependencies ++= Seq(
      "org.typelevel" %% "cats-effect" % "3.5.7",
      "org.http4s" %% "http4s-dsl" % "0.23.30",
      "org.http4s" %% "http4s-ember-server" % "0.23.30",
      "org.http4s" %% "http4s-circe" % "0.23.30",
      "io.circe" %% "circe-generic" % "0.14.10",
      "org.postgresql" % "postgresql" % "42.7.5",
      "org.slf4j" % "slf4j-simple" % "2.0.16"
    )
  )
