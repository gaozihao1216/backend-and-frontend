package microservice.admin.support.director.level_assignment

import java.sql.Connection
import microservice.admin.objects.director.level_assignment.{
  DirectorBirdPoolOption,
  DirectorLevelAssignmentBoard,
  LevelSlotAssignment,
  LevelSlotAssignmentDetail
}
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.BirdRowMapper
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable
import microservice.player.preparation.BirdPreparationCatalog

/** 总监关卡槽位分配辅助逻辑。
  *
  * 解决的问题：APIMessage 不宜内联复杂联查；看板组装需复用 submissionWithLevel、birdPoolOptions。
  * 使用者：GetDirectorLevelAssignmentBoardAPIMessage、AssignLevelSlotAPIMessage 等。
  */
object DirectorLevelAssignmentSupport {
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
