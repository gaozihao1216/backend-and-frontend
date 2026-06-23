package microservice.admin.routes

import io.circe.generic.auto._
import microservice.admin.api.audit.ListAdminAuditLogsAPIMessage
import microservice.admin.api.comments.{DeleteCommentAPIMessage, GetAdminCommentsAPIMessage}
import microservice.admin.api.director.bird_skill.{
  GetDirectorBirdSkillAPIMessage,
  GetDirectorBirdSkillBoardAPIMessage,
  SaveDirectorBirdSkillAPIMessage
}
import microservice.admin.api.director.level_assignment.{
  AbolishDirectorSubmissionAPIMessage,
  AssignLevelSlotAPIMessage,
  GetDirectorLevelAssignmentBoardAPIMessage,
  UnassignLevelSlotAPIMessage,
  UpdateLevelSlotBirdPoolAPIMessage
}
import microservice.admin.api.director.permissions.{
  GetDirectorPermissionsAPIMessage,
  TransferDirectorPermissionAPIMessage
}
import microservice.admin.api.shop.{
  CreateShopItemAPIMessage,
  DeactivateShopItemAPIMessage,
  ListAdminShopItemsAPIMessage,
  UpdateShopItemAPIMessage
}
import microservice.admin.api.submissions.{GetPendingSubmissionsAPIMessage, ReviewSubmissionAPIMessage}
import microservice.admin.objects.bird.{
  AdminBirdSkillConfig,
  AdminDirectorBirdSkillBoard,
  AdminDirectorBirdSkillEntry
}
import microservice.admin.objects.director.level_assignment.assignment.{
  LevelSlotAssignment,
  LevelSlotAssignmentDetail
}
import microservice.admin.objects.director.level_assignment.board.DirectorLevelAssignmentBoard
import microservice.admin.objects.director.permissions.{DirectorPermissionSummary, DirectorTransferResult}
import microservice.admin.objects.level.{AdminLevelComment, AdminSubmissionWithLevel}
import microservice.admin.objects.shop.AdminShopItem
import microservice.admin.objects.submission.{ReviewAudit, ReviewedSubmission}
import microservice.infrastructure.api.RegisteredAPIMessage
import microservice.infrastructure.api.RegisteredAPIMessage.protectedApi

object AdminApiMessages {
  val apiMessages: List[RegisteredAPIMessage] = List(
    protectedApi[ListAdminAuditLogsAPIMessage, List[ReviewAudit]](),
    protectedApi[ListAdminShopItemsAPIMessage, List[AdminShopItem]](),
    protectedApi[CreateShopItemAPIMessage, AdminShopItem](),
    protectedApi[UpdateShopItemAPIMessage, AdminShopItem](),
    protectedApi[DeactivateShopItemAPIMessage, AdminShopItem](),
    protectedApi[GetAdminCommentsAPIMessage, List[AdminLevelComment]](),
    protectedApi[DeleteCommentAPIMessage, AdminLevelComment](),
    protectedApi[GetPendingSubmissionsAPIMessage, List[AdminSubmissionWithLevel]](),
    protectedApi[ReviewSubmissionAPIMessage, ReviewedSubmission](identityFields = List("reviewerId")),
    protectedApi[GetDirectorPermissionsAPIMessage, DirectorPermissionSummary](),
    protectedApi[TransferDirectorPermissionAPIMessage, DirectorTransferResult](identityFields = List("currentDirectorId")),
    protectedApi[GetDirectorLevelAssignmentBoardAPIMessage, DirectorLevelAssignmentBoard](),
    protectedApi[AssignLevelSlotAPIMessage, LevelSlotAssignmentDetail](),
    protectedApi[UnassignLevelSlotAPIMessage, LevelSlotAssignment](),
    protectedApi[UpdateLevelSlotBirdPoolAPIMessage, LevelSlotAssignmentDetail](),
    protectedApi[AbolishDirectorSubmissionAPIMessage, AdminSubmissionWithLevel](),
    protectedApi[GetDirectorBirdSkillBoardAPIMessage, AdminDirectorBirdSkillBoard](),
    protectedApi[GetDirectorBirdSkillAPIMessage, AdminDirectorBirdSkillEntry](),
    protectedApi[SaveDirectorBirdSkillAPIMessage, AdminBirdSkillConfig]()
  )
}
