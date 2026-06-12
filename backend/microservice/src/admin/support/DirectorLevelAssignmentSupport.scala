package microservice.admin.support

import java.sql.Connection
import microservice.admin.objects.{
  DirectorBirdPoolOption,
  DirectorLevelAssignmentBoard,
  LevelSlotAssignment,
  LevelSlotAssignmentDetail
}
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.BirdRowMapper
import microservice.level.objects.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable
import microservice.player.preparation.BirdPreparationCatalog

/** 总监关卡槽位分配辅助：组装看板数据、关联投稿与关卡、构建可选 bird pool。 */
object DirectorLevelAssignmentSupport {
  def submissionWithLevel(connection: Connection, submissionId: String): Option[SubmissionWithLevel] =
    SubmissionTable.findById(connection, submissionId).flatMap { submission =>
      LevelTable.findById(connection, submission.levelId).map { level =>
        SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
      }
    }

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
