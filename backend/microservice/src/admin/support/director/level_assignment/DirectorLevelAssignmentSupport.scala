package microservice.admin.support.director.level_assignment

import java.sql.Connection
import microservice.admin.objects.director.level_assignment.AssignLevelSlotErrors
import microservice.admin.objects.director.level_assignment.board.DirectorBirdPoolOption
import microservice.admin.objects.director.level_assignment.board.DirectorLevelAssignmentBoard
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.objects.director.level_assignment.LevelSlotCatalog
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.BirdRowMapper
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.{LevelRowMapper, LevelSlotAssignmentRow, SubmissionRow}
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable
import microservice.player.preparation.BirdPreparationCatalog
import microservice.system.objects.SubmissionStatus

/** 总监关卡槽位分配辅助逻辑。
  *
  * 解决的问题：APIMessage 不宜内联复杂联查；看板组装需复用 submissionWithLevel、birdPoolOptions。
  * 使用者：GetDirectorLevelAssignmentBoardAPIMessage、AssignLevelSlotAPIMessage 等。
  */
object DirectorLevelAssignmentSupport {
  def requireSupportedSuffix(levelSuffix: String): Step[Unit] =
    PlanStep.fromEither(checkSupportedSuffix(levelSuffix))

  def requireApprovedSubmission(connection: Connection, submissionId: String): Step[SubmissionRow] =
    PlanStep.fromEither(checkApprovedSubmission(connection, submissionId))

  def requireLinkedLevel(connection: Connection, levelId: String): Step[Unit] =
    PlanStep.fromEither(checkLinkedLevel(connection, levelId))

  def requireAssignmentForSuffix(connection: Connection, levelSuffix: String): Step[LevelSlotAssignmentRow] =
    PlanStep.fromEither(checkAssignmentForSuffix(connection, levelSuffix))

  def requireUnassignBySuffix(connection: Connection, levelSuffix: String): Step[LevelSlotAssignmentRow] =
    PlanStep.fromEither(checkUnassignBySuffix(connection, levelSuffix))

  def requireAbolishableSubmission(connection: Connection, submissionId: String): Step[SubmissionRow] =
    PlanStep.fromEither(checkAbolishableSubmission(connection, submissionId))

  def checkSupportedSuffix(levelSuffix: String): Either[HttpError, Unit] =
    if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
    else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)

  def checkApprovedSubmission(connection: Connection, submissionId: String): Either[HttpError, SubmissionRow] =
    for {
      submission <- SubmissionTable.findById(connection, submissionId).toRight(
        AssignLevelSlotErrors.SubmissionMissing(submissionId).toHttpError
      )
      _ <-
        if (submission.status == SubmissionStatus.Approved) Right(())
        else Left(AssignLevelSlotErrors.SubmissionNotApproved(submissionId).toHttpError)
    } yield submission

  def checkLinkedLevel(connection: Connection, levelId: String): Either[HttpError, Unit] =
    LevelTable.findById(connection, levelId).toRight(
      AssignLevelSlotErrors.LinkedLevelMissing(levelId).toHttpError
    ).map(_ => ())

  def checkAssignmentForSuffix(connection: Connection, levelSuffix: String): Either[HttpError, LevelSlotAssignmentRow] =
    LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix).toRight(
      AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError
    )

  def checkUnassignBySuffix(connection: Connection, levelSuffix: String): Either[HttpError, LevelSlotAssignmentRow] =
    for {
      existing <- checkAssignmentForSuffix(connection, levelSuffix)
      _ <-
        if (LevelSlotAssignmentTable.deleteBySuffix(connection, levelSuffix)) Right(())
        else Left(AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError)
    } yield existing

  def checkAbolishableSubmission(connection: Connection, submissionId: String): Either[HttpError, SubmissionRow] =
    for {
      submission <- SubmissionTable.findById(connection, submissionId).toRight(
        AssignLevelSlotErrors.SubmissionMissing(submissionId).toHttpError
      )
      _ <-
        if (submission.status == SubmissionStatus.Approved) Right(())
        else Left(AssignLevelSlotErrors.SubmissionNotAbolishable(submissionId).toHttpError)
    } yield submission

  /** 按 submissionId 联查 Submission + Level，组装 SubmissionWithLevel。 */
  def submissionWithLevel(connection: Connection, submissionId: String): Option[SubmissionWithLevel] =
    SubmissionTable.findById(connection, submissionId).flatMap { submission =>
      LevelTable.findById(connection, submission.levelId).map { level =>
        SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
      }
    }

  /** 构建总监配置 bird pool 时的下拉选项：系统内置鸟 + 已发布设计师鸟。 */
  def buildBirdPoolOptions(connection: Connection): List[DirectorBirdPoolOption] = {
    val systemOptions =
      BirdPreparationCatalog.entries.map { entry =>
        DirectorBirdPoolOption(
          birdType = entry.birdType,
          name = entry.name,
          source = "system",
          authorId = None
        )
      }.toList

    val designerOptions =
      BirdDesignTable
        .listPublished(connection)
        .map(BirdRowMapper.toBirdDesign)
        .map { design =>
          DirectorBirdPoolOption(
            birdType = design.id,
            name = design.name,
            source = "designer",
            authorId = Some(design.authorId)
          )
        }
        .toList

    systemOptions ++ designerOptions
  }

  /** 组装总监关卡分配看板：已占用槽位、待分配 Approved 投稿、bird pool 选项。 */
  def buildBoard(connection: Connection): DirectorLevelAssignmentBoard = {
    val assignedSubmissionIds =
      LevelSlotAssignmentTable.listAll(connection).map(_.submissionId).toSet

    val assignments =
      LevelSlotAssignmentTable.listAll(connection).flatMap { row =>
        submissionWithLevel(connection, row.submissionId).map { submission =>
          LevelSlotAssignmentDetail(LevelSlotAssignment.from(row), submission)
        }
      }.toList

    val pendingApproved =
      SubmissionTable.listApproved(connection)
        .filterNot(submission => assignedSubmissionIds.contains(submission.id))
        .flatMap(submission =>
          LevelTable.findById(connection, submission.levelId).map { level =>
            SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
          }
        )
        .toList

    DirectorLevelAssignmentBoard(
      assignments = assignments,
      pendingApproved = pendingApproved,
      birdPoolOptions = buildBirdPoolOptions(connection)
    )
  }
}
