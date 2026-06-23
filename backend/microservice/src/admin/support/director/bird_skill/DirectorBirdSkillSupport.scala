package microservice.admin.support.director.bird_skill

import java.sql.Connection
import microservice.bird.objects.skill.director.{DirectorBirdSkillBoard, DirectorBirdSkillEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationCatalog
import io.circe.Json

/** 总监鸟类技能配置辅助逻辑。
  *
  * 解决的问题：看板组装与 skills JSON 结构校验从 APIMessage 中剥离，便于复用与测试。
  * 使用者：GetDirectorBirdSkillBoardAPIMessage、SaveDirectorBirdSkillAPIMessage。
  */
object DirectorBirdSkillSupport {
  /** 合并 PlayerPreparationCatalog 与 BirdSkillConfigTable，构建技能配置看板。 */
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

  /** 校验 skills JSON 须含非空 stages 数组；失败返回 INVALID_SKILLS。 */
  def requireSkillsJson(skills: Json): Step[Json] =
    PlanStep.fromEither(checkSkillsJson(skills))

  def checkSkillsJson(skills: Json): Either[HttpError, Json] =
    skills.hcursor.downField("stages").focus match {
      case None => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages is required"))
      case Some(stages) if !stages.isArray => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must be an array"))
      case Some(stages) if stages.asArray.exists(_.isEmpty) =>
        Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must not be empty"))
      case _ => Right(skills)
    }
}
