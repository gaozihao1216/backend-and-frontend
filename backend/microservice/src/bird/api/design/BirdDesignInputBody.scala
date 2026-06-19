package microservice.bird.api.design

/** 鸟类设计输入的统一结构，供 Create/Update APIMessage 与 BirdDesignValidation 共用。
  *
  * @param name 鸟名称，校验后至少 2 字符
  * @param summary 简介，至少 6 字符
  * @param skillName 技能名称，至少 2 字符
  * @param attack/impact/speed 属性值，范围 1–200
  * @param tierSkills 三档技能描述，须恰好 3 条
  * @param previewImageUrl 可选预览图 URL
  * @param mechanismTags 机制标签列表
  */
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
