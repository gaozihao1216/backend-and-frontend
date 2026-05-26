package com.example.microservice.service

import cats.effect.IO
import com.example.microservice.model.{CreateUserRequest, User}

import java.sql.{Connection, DriverManager, ResultSet}

final case class DbConfig(url: String, user: String, password: String)

final class UserService(dbConfig: DbConfig) {
  Class.forName("org.postgresql.Driver")

  private def withConnection[A](f: Connection => A): IO[A] =
    IO.blocking {
      val connection = DriverManager.getConnection(dbConfig.url, dbConfig.user, dbConfig.password)
      try f(connection)
      finally connection.close()
    }

  def initialize(): IO[Unit] =
    withConnection { connection =>
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            |CREATE TABLE IF NOT EXISTS users (
            |  id BIGSERIAL PRIMARY KEY,
            |  name TEXT NOT NULL,
            |  email TEXT NOT NULL
            |)
            |""".stripMargin
        )
        ()
      } finally statement.close()
    }

  def createUser(request: CreateUserRequest): IO[User] =
    withConnection { connection =>
      val statement = connection.prepareStatement(
        "INSERT INTO users (name, email) VALUES (?, ?) RETURNING id"
      )

      try {
        statement.setString(1, request.name)
        statement.setString(2, request.email)

        val resultSet = statement.executeQuery()
        try {
          resultSet.next()
          User(
            id = resultSet.getLong("id"),
            name = request.name,
            email = request.email
          )
        } finally resultSet.close()
      } finally statement.close()
    }

  def getUser(id: Long): IO[Option[User]] =
    withConnection { connection =>
      val statement = connection.prepareStatement(
        "SELECT id, name, email FROM users WHERE id = ?"
      )

      try {
        statement.setLong(1, id)
        val resultSet = statement.executeQuery()
        try readUser(resultSet)
        finally resultSet.close()
      } finally statement.close()
    }

  private def readUser(resultSet: ResultSet): Option[User] =
    if (resultSet.next()) {
      Some(
        User(
          id = resultSet.getLong("id"),
          name = resultSet.getString("name"),
          email = resultSet.getString("email")
        )
      )
    } else {
      None
    }
}
