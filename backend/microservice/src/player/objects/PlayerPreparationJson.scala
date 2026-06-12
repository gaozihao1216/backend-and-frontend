package microservice.player.objects

import io.circe.Json

/** 备战 API 响应 JSON 编码（无 Connection 依赖）。 */
object PlayerPreparationJson {
  def toJson(response: PlayerPreparationResponse): Json =
    Json.obj(
      "birds" -> Json.arr(response.birds.map(birdToJson): _*),
      "slingshot" -> Json.obj(
        "level" -> Json.fromInt(response.slingshot.level),
        "maxLevel" -> Json.fromInt(response.slingshot.maxLevel),
        "nextCostCoins" -> Json.fromInt(response.slingshot.nextCostCoins)
      ),
      "walletCoins" -> Json.fromInt(response.walletCoins),
      "walletFragments" -> Json.fromInt(response.walletFragments)
    )

  private def birdToJson(bird: BirdUpgradeView): Json =
    Json.obj(
      "birdType" -> Json.fromString(bird.birdType),
      "name" -> Json.fromString(bird.name),
      "summary" -> Json.fromString(bird.summary),
      "previewImageUrl" -> Json.fromString(bird.previewImageUrl),
      "level" -> Json.fromInt(bird.level),
      "maxLevel" -> Json.fromInt(bird.maxLevel),
      "tier" -> Json.fromInt(bird.tier),
      "maxTier" -> Json.fromInt(bird.maxTier),
      "stats" -> Json.obj(
        "attack" -> Json.fromInt(bird.stats.attack),
        "impact" -> Json.fromInt(bird.stats.impact),
        "speed" -> Json.fromInt(bird.stats.speed)
      ),
      "skillName" -> Json.fromString(bird.skillName),
      "skillDescription" -> Json.fromString(bird.skillDescription),
      "nextTierSkillPreview" -> bird.nextTierSkillPreview.fold(Json.Null)(Json.fromString),
      "nextCostCoins" -> Json.fromInt(bird.nextCostCoins),
      "nextCostFragments" -> Json.fromInt(bird.nextCostFragments),
      "source" -> Json.fromString(bird.source),
      "authorId" -> bird.authorId.fold(Json.Null)(Json.fromString),
      "skills" -> bird.skills.fold(Json.Null)(identity),
      "modelImageUrl" -> bird.modelImageUrl.fold(Json.Null)(Json.fromString)
    )
}
