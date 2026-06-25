package microservice.ui.api.pages

import microservice.testsupport.TestSupport
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.page.PageLayout
import microservice.ui.objects.page.PageLayoutType
import microservice.ui.objects.endpoint.UiEndpoint
import munit.CatsEffectSuite
import microservice.ui.objects.page.request.UpdateUiPageRequest

class UiPagePublishSuite extends CatsEffectSuite {
  private val directorId = "admin-director-1"
  private val pageId = "player.shop.demo"

  private val samplePage = PageConfig(
    id = pageId,
    name = "Demo Shop",
    path = "/player_shop",
    roleScope = UiEndpoint.Player,
    layout = PageLayout(`type` = PageLayoutType.Stack, columns = None, gap = None, padding = None),
    components = List.empty
  )

  private val updatedPage = samplePage.copy(name = "Demo Shop v2")

  test("publish stores page and rollback restores previous version") {
    TestSupport.seed()

    for {
      first <- PublishUiPageAPIMessage(directorId, pageId, UpdateUiPageRequest(samplePage)).run(TestSupport.session)
      second <- PublishUiPageAPIMessage(directorId, pageId, UpdateUiPageRequest(updatedPage)).run(TestSupport.session)
      playerView <- GetPlayerUiPageAPIMessage("player-1", pageId).run(TestSupport.session)
      rolledBack <- RollbackUiPageAPIMessage(directorId, pageId).run(TestSupport.session)
      playerAfterRollback <- GetPlayerUiPageAPIMessage("player-1", pageId).run(TestSupport.session)
    } yield {
      assertEquals(first.map(_.name), Right("Demo Shop"))
      assertEquals(second.map(_.name), Right("Demo Shop v2"))
      assertEquals(playerView.map(_.name), Right("Demo Shop v2"))
      assertEquals(rolledBack.map(_.name), Right("Demo Shop"))
      assertEquals(playerAfterRollback.map(_.name), Right("Demo Shop"))
    }
  }

  test("rollback fails when no snapshot exists") {
    TestSupport.seed()

    PublishUiPageAPIMessage(directorId, "player.social.demo", UpdateUiPageRequest(samplePage.copy(id = "player.social.demo")))
      .run(TestSupport.session)
      .flatMap { firstPublish =>
        assertEquals(firstPublish.map(_.id), Right("player.social.demo"))
        RollbackUiPageAPIMessage(directorId, "player.social.demo").run(TestSupport.session).map { rollback =>
          assertEquals(rollback.left.map(_.code), Left("UI_PAGE_ROLLBACK_UNAVAILABLE"))
        }
      }
  }
}
