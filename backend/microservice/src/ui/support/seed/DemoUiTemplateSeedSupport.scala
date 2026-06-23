package microservice.ui.support.seed

import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.sql.Connection
import microservice.ui.objects.category.ButtonTemplateCategory
import microservice.ui.objects.button_template.ButtonTemplateScalingMode
import microservice.ui.objects.button_template.ButtonTemplateSlice
import microservice.ui.objects.category.PanelTemplateCategory
import microservice.ui.objects.category.PatternTemplateCategory
import microservice.ui.objects.stretch_template.StretchVisualTemplateKind
import microservice.ui.tables.button_template.ButtonTemplateRow
import microservice.ui.tables.stretch_visual_template.StretchVisualTemplateRow
import microservice.ui.tables.button_template.ButtonTemplateTable
import microservice.ui.tables.stretch_visual_template.StretchVisualTemplateTable

/** UI 演示模板种子（ui 模块内）。 */
object DemoUiTemplateSeedSupport {
  private val defaultButtonSvg =
    """
      |<svg xmlns="http://www.w3.org/2000/svg" width="360" height="144" viewBox="0 0 360 144">
      |  <defs>
      |    <linearGradient id="button" x1="0" x2="1" y1="0" y2="1">
      |          <stop offset="0" stop-color="#7dd3fc"/>
      |          <stop offset="0.52" stop-color="#2563eb"/>
      |          <stop offset="1" stop-color="#1e3a8a"/>
      |        </linearGradient>
      |      </defs>
      |      <rect x="10" y="10" width="340" height="124" rx="34" fill="url(#button)"/>
      |      <path d="M42 25h276c18 0 30 12 30 30v6H12v-6c0-18 12-30 30-30z" fill="rgba(255,255,255,0.28)"/>
      |      <path d="M42 126h276c18 0 30-12 30-30v-10H12v10c0 18 12 30 30 30z" fill="rgba(15,23,42,0.2)"/>
      |    </svg>
      |""".stripMargin.trim

  private val defaultPanelSvg =
    """
      |<svg xmlns="http://www.w3.org/2000/svg" width="420" height="280" viewBox="0 0 420 280">
      |  <rect x="12" y="12" width="396" height="256" rx="28" fill="#ffffff" stroke="#94a3b8" stroke-width="8"/>
      |  <rect x="28" y="28" width="364" height="56" rx="16" fill="#dbeafe"/>
      |  <rect x="28" y="96" width="364" height="156" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
      |</svg>
      |""".stripMargin.trim

  private val defaultPatternSvg =
    """
      |<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      |  <circle cx="80" cy="80" r="56" fill="#fde68a" stroke="#f59e0b" stroke-width="8"/>
      |  <path d="M80 34l12 28h29l-23 18 9 29-27-17-27 17 9-29-23-18h29z" fill="#f97316"/>
      |</svg>
      |""".stripMargin.trim

  private def svgDataUrl(svg: String): String = {
    val encoded = URLEncoder.encode(svg, StandardCharsets.UTF_8.name()).replace("+", "%20")
    s"data:image/svg+xml;charset=utf-8,$encoded"
  }

  def buttonTemplates(timestamp: String): Vector[ButtonTemplateRow] =
    Vector(
      ButtonTemplateRow(
        id = "btn-demo-primary",
        name = "演示按钮底座",
        sourceDataUrl = svgDataUrl(defaultButtonSvg),
        category = ButtonTemplateCategory.Business,
        scalingMode = ButtonTemplateScalingMode.FixedAspect,
        slice = ButtonTemplateSlice(top = 24, right = 24, bottom = 24, left = 24),
        createdAt = timestamp,
        updatedAt = timestamp
      )
    )

  def stretchVisualTemplates(timestamp: String): Vector[StretchVisualTemplateRow] =
    Vector(
      StretchVisualTemplateRow(
        id = "panel-demo-surface",
        name = "演示面板背景",
        sourceDataUrl = svgDataUrl(defaultPanelSvg),
        kind = StretchVisualTemplateKind.Panel,
        category = PanelTemplateCategory.LevelBackground,
        createdAt = timestamp,
        updatedAt = timestamp
      ),
      StretchVisualTemplateRow(
        id = "pattern-demo-star",
        name = "演示图案",
        sourceDataUrl = svgDataUrl(defaultPatternSvg),
        kind = StretchVisualTemplateKind.Pattern,
        category = PatternTemplateCategory.Button,
        createdAt = timestamp,
        updatedAt = timestamp
      )
    )

  def seedJdbcIfEmpty(connection: Connection, createdAt: String): Unit = {
    if (ButtonTemplateTable.findById(connection, "btn-demo-primary").isEmpty) {
      buttonTemplates(createdAt).foreach { row =>
        ButtonTemplateTable.insert(connection, row)
      }
    }

    if (StretchVisualTemplateTable.findById(connection, "panel-demo-surface").isEmpty) {
      stretchVisualTemplates(createdAt).foreach { row =>
        StretchVisualTemplateTable.insert(connection, row)
      }
    }
  }
}
