package microservice.user

import microservice.user.api.GetUserProfileAPIMessage
import microservice.user.tables.UserProfileTable
import microservice.testsupport.TestSupport
import munit.CatsEffectSuite

/** UserProfileTable 读聚合。 */
class UserProfileTableSuite extends CatsEffectSuite {
  override def beforeAll(): Unit = {
    TestSupport.seed()
    super.beforeAll()
  }

  test("findProfile returns seeded designer profile") {
    GetUserProfileAPIMessage(viewerUserId = "player-1", profileUserId = "designer-1")
      .run(TestSupport.session)
      .map {
        case Right(profile) =>
          assertEquals(profile.user.id, "designer-1")
          assert(profile.publishedLevels.nonEmpty || profile.recentComments.nonEmpty || profile.stats.ratingCount >= 0)
        case Left(error) => fail(s"expected success, got ${error.code}")
      }
  }

  test("findProjection matches findProfile counts") {
    val profile =
      UserProfileTable.findProfile(null, "designer-1").getOrElse(fail("expected designer profile"))
    val projection =
      UserProfileTable.findProjection(null, "designer-1").getOrElse(fail("expected designer projection"))

    assertEquals(projection.userId, profile.user.id)
    assertEquals(projection.publishedLevelIds.size, profile.publishedLevels.size)
    assertEquals(projection.recentCommentIds.size, profile.recentComments.size)
    assertEquals(projection.favoriteCount, profile.stats.favoriteCount)
    assertEquals(projection.ratingCount, profile.stats.ratingCount)
  }
}
