package microservice.player.objects.catalog

/** 系统内置鸟备战快照（player 模块边界 DTO）。 */
final case class PreparationSystemBirdSnapshot(
  birdType: String,
  name: String,
  summary: String,
  previewImageUrl: String,
  attack: Int,
  impact: Int,
  speed: Int,
  skillName: String,
  tierSkillDescriptions: Vector[String]
)

/** 已发布设计鸟备战快照（player 模块边界 DTO）。 */
final case class PreparationPublishedBirdSnapshot(
  birdType: String,
  name: String,
  summary: String,
  previewImageUrl: String,
  attack: Int,
  impact: Int,
  speed: Int,
  skillName: String,
  tierSkills: List[String],
  authorId: String
)
