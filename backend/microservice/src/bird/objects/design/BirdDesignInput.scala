package microservice.bird.objects.design

/** 鸟类设计可编辑字段的统一输入模型，供校验与 Row 组装共用（非 HTTP 专用 DTO）。
  *
  * 字段约束（由 [[microservice.bird.validation.design.BirdDesignValidation]] 执行）：
  *   - name / skillName：trim 后至少 2 字符
  *   - summary：至少 6 字符
  *   - attack / impact / speed：1–200
  *   - tierSkills：恰好 3 条非空描述
  *   - previewImageUrl：可选预览图 URL
  *   - mechanismTags：机制标签列表，可为空
  *
  * 关联：CreateBirdDesignBody / UpdateBirdDesignBody 映射为本类型后校验；持久化为 [[BirdDesign]]。
  */
final case class BirdDesignInput(
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
