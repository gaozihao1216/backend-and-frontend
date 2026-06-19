package microservice.admin.support.director.bird_skill

import java.sql.Connection
import microservice.bird.objects.skill.{DirectorBirdSkillBoard, DirectorBirdSkillEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationCatalog
import io.circe.Json

/** 总监鸟类技能配置辅助：组装看板、校验 skills JSON 结构。 */
object DirectorBirdSkillSupport {
  def buildBoard(connection: Connection): DirectorBirdSkillBoard = {
    val configured = BirdSkillConfigTable.skillsJsonMap(connection)
    val birds =
      PlayerPreparationCatalog.loadEntries(connection).map { entry =>
        val config = configured.get(entry.birdType)
        DirectorBirdSkillEntry(
          birdType = entry.birdType,
          name = entry.name,
          source = entry.source,
          authorId = entry.authorId,
          skillName = entry.skillName,
          tierSkillDescriptions = entry.tierSkillDescriptions.toList,
          configured = config.isDefined,
          skills = config.map(_.skills),
          modelImageUrl = config.flatMap(_.modelImageUrl).orElse(Some(entry.previewImageUrl))
        )
      }.toList
    DirectorBirdSkillBoard(birds = birds)
  }

  def validateSkillsJson(skills: Json): Either[HttpError, Json] =
    skills.hcursor.downField("stages").focus match {
      case None => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages is required"))
      case Some(stages) if !stages.isArray => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must be an array"))
      case Some(stages) if stages.asArray.exists(_.isEmpty) =>
        Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must not be empty"))
      case _ => Right(skills)
    }
}
