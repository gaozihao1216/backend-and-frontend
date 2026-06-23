package microservice.admin.api.shop.validation

import microservice.admin.api.shop.body.{CreateShopItemBody, UpdateShopItemBody}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError

object AdminShopItemValidation {
  private val allowedCurrencies: Set[String] = Set("coins", "gems")

  def validateCreate(body: CreateShopItemBody): Step[CreateShopItemBody] =
    PlanStep.fromEither(checkCreate(body))

  def validateUpdate(body: UpdateShopItemBody): Step[UpdateShopItemBody] =
    PlanStep.fromEither(checkUpdate(body))

  def checkCreate(body: CreateShopItemBody): Either[HttpError, CreateShopItemBody] =
    checkFields(body.name, body.description, body.price, body.currency).map(_ => body)

  def checkUpdate(body: UpdateShopItemBody): Either[HttpError, UpdateShopItemBody] =
    checkFields(body.name, body.description, body.price, body.currency).map(_ => body)

  private def checkFields(
    name: String,
    description: String,
    price: Int,
    currency: String
  ): Either[HttpError, Unit] =
    if (name.trim.length < 2) {
      Left(HttpError.badRequest("INVALID_SHOP_ITEM_NAME", "Shop item name must be at least 2 characters"))
    } else if (description.trim.length < 4) {
      Left(HttpError.badRequest("INVALID_SHOP_ITEM_DESCRIPTION", "Shop item description must be at least 4 characters"))
    } else if (price < 1) {
      Left(HttpError.badRequest("INVALID_SHOP_ITEM_PRICE", "Shop item price must be at least 1"))
    } else if (!allowedCurrencies.contains(currency.trim)) {
      Left(HttpError.badRequest("INVALID_SHOP_ITEM_CURRENCY", "Shop item currency must be coins or gems"))
    } else {
      Right(())
    }
}
