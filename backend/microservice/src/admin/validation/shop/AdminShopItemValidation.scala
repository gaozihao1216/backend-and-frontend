package microservice.admin.validation.shop

import cats.effect.IO
import microservice.admin.objects.shop.request.{CreateShopItemRequest, UpdateShopItemRequest}
import microservice.infrastructure.http.HttpError

/** 管理员商店商品创建/更新请求体字段校验。 */
private[admin] object AdminShopItemValidation {
  private val allowedCurrencies: Set[String] = Set("coins", "gems")

  /** 校验创建商品请求体字段。 */
  def validateCreate(body: CreateShopItemRequest): IO[Either[HttpError, CreateShopItemRequest]] =
    IO.pure(checkCreate(body))

  /** 校验更新商品请求体字段。 */
  def validateUpdate(body: UpdateShopItemRequest): IO[Either[HttpError, UpdateShopItemRequest]] =
    IO.pure(checkUpdate(body))

  /** 同步校验创建请求体。 */
  private def checkCreate(body: CreateShopItemRequest): Either[HttpError, CreateShopItemRequest] =
    checkFields(body.name, body.description, body.price, body.currency).map(_ => body)

  /** 同步校验更新请求体。 */
  private def checkUpdate(body: UpdateShopItemRequest): Either[HttpError, UpdateShopItemRequest] =
    checkFields(body.name, body.description, body.price, body.currency).map(_ => body)

  /** 校验 name/description 长度、price 下限与 currency 白名单。 */
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
      // currency 仅允许 coins 或 gems
      Left(HttpError.badRequest("INVALID_SHOP_ITEM_CURRENCY", "Shop item currency must be coins or gems"))
    } else {
      Right(())
    }
}
