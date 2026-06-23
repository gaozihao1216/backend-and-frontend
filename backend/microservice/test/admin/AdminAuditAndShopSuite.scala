package microservice.admin

import microservice.admin.api.audit.ListAdminAuditLogsAPIMessage
import microservice.admin.api.shop.{
  CreateShopItemAPIMessage,
  DeactivateShopItemAPIMessage,
  ListAdminShopItemsAPIMessage,
  UpdateShopItemAPIMessage
}
import microservice.admin.tables.AdminAuditTable
import microservice.system.objects.AuditTargetType
import microservice.testsupport.TestSupport
import microservice.system.objects.SubmissionStatus
import munit.CatsEffectSuite
import microservice.admin.body.shop.{CreateShopItemBody, UpdateShopItemBody}

/** 审计日志与商店管理 API。 */
class AdminAuditAndShopSuite extends CatsEffectSuite {
  override def beforeAll(): Unit = {
    TestSupport.seed()
    super.beforeAll()
  }

  override def beforeEach(context: BeforeEach): Unit = {
    TestSupport.clearReviewAudits()
    super.beforeEach(context)
  }

  test("ListAdminAuditLogsAPIMessage returns seeded audit rows after recordReview") {
    AdminAuditTable.recordReview(
      connection = null,
      targetType = AuditTargetType.LevelSubmission,
      submissionId = "submission-audit-api",
      reviewerId = "admin-1",
      decision = SubmissionStatus.Approved.value,
      reviewNote = Some("ok"),
      reviewedAt = "2026-01-01T00:00:00Z"
    )

    ListAdminAuditLogsAPIMessage("admin-1", submissionId = Some("submission-audit-api"))
      .run(TestSupport.session)
      .map {
        case Right(logs) =>
          assertEquals(logs.size, 1)
          assertEquals(logs.head.reviewerId, "admin-1")
        case Left(error) => fail(s"expected success, got ${error.code}")
      }
  }

  test("ListAdminShopItemsAPIMessage lists seeded shop items") {
    ListAdminShopItemsAPIMessage("admin-1")
      .run(TestSupport.session)
      .map {
        case Right(items) => assert(items.nonEmpty)
        case Left(error)  => fail(s"expected success, got ${error.code}")
      }
  }

  test("CreateShopItemAPIMessage inserts and DeactivateShopItemAPIMessage deactivates") {
    CreateShopItemAPIMessage(
      "admin-1",
      CreateShopItemBody(
        name = "Test Item",
        description = "Test description",
        price = 99,
        currency = "coins",
        catalogIndex = 2,
        active = true,
        sortOrder = 9
      )
    )
      .run(TestSupport.session)
      .flatMap {
        case Right(item) =>
          DeactivateShopItemAPIMessage("admin-1", item.id)
            .run(TestSupport.session)
            .map {
              case Right(deactivated) =>
                assertEquals(item.name, "Test Item")
                assert(item.active)
                assert(!deactivated.active)
              case Left(error) => fail(s"deactivate failed: ${error.code}")
            }
        case Left(error) => fail(s"create failed: ${error.code}")
      }
  }

  test("UpdateShopItemAPIMessage updates existing item") {
    ListAdminShopItemsAPIMessage("admin-1")
      .run(TestSupport.session)
      .flatMap {
        case Right(items) =>
          val item = items.head
          UpdateShopItemAPIMessage(
            "admin-1",
            item.id,
            UpdateShopItemBody(
              name = item.name + " Updated",
              description = item.description,
              price = item.price,
              currency = item.currency,
              catalogIndex = item.catalogIndex,
              active = item.active,
              sortOrder = item.sortOrder
            )
          ).run(TestSupport.session)
        case Left(error) => fail(s"list failed: ${error.code}")
      }
      .map {
        case Right(updated) => assert(updated.name.endsWith(" Updated"))
        case Left(error)    => fail(s"update failed: ${error.code}")
      }
  }
}
