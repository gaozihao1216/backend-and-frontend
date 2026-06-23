package microservice.admin

import microservice.admin.tables.AdminAuditTable
import microservice.system.objects.AuditTargetType
import microservice.testsupport.TestSupport
import microservice.system.objects.SubmissionStatus
import munit.CatsEffectSuite

/** AdminAuditTable 写入与查询。 */
class AdminAuditTableSuite extends CatsEffectSuite {
  override def beforeAll(): Unit = {
    TestSupport.seed()
    super.beforeAll()
  }

  override def beforeEach(context: BeforeEach): Unit = {
    TestSupport.clearReviewAudits()
    super.beforeEach(context)
  }

  test("recordReview persists level submission audit row") {
    AdminAuditTable.recordReview(
      connection = null,
      targetType = AuditTargetType.LevelSubmission,
      submissionId = "submission-audit-test",
      reviewerId = "admin-1",
      decision = SubmissionStatus.Approved.value,
      reviewNote = Some("Looks good"),
      reviewedAt = "2026-01-01T00:00:00Z"
    )

    val audits = AdminAuditTable.listBySubmissionId(null, "submission-audit-test")
    assertEquals(audits.size, 1)
    assertEquals(audits.head.targetType, AuditTargetType.LevelSubmission)
    assertEquals(audits.head.reviewerId, "admin-1")
    assertEquals(audits.head.decision, SubmissionStatus.Approved.value)
  }

  test("recordReview supports listByReviewerId") {
    AdminAuditTable.recordReview(
      connection = null,
      targetType = AuditTargetType.BirdSubmission,
      submissionId = "bird-submission-test",
      reviewerId = "admin-1",
      decision = SubmissionStatus.Rejected.value,
      reviewNote = Some("Needs work"),
      reviewedAt = "2026-01-02T00:00:00Z"
    )

    val byReviewer = AdminAuditTable.listByReviewerId(null, "admin-1")
    assert(byReviewer.exists(row => row.submissionId == "bird-submission-test"))
  }
}
