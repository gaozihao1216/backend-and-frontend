package microservice.user

import microservice.user.api.GetUserProfileAPIMessage
import microservice.testsupport.TestSupport
import munit.CatsEffectSuite

/** 用户资料读聚合。 */
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
}
