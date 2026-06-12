package microservice.bird.api

/** 鸟类设计输入的统一结构，供 Create/Update 与 Validation 共用。 */
final case class BirdDesignInputBody(
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkills: List[String],
  previewImageUrl: Option[String],
  mechanismTags: List[String]
)
