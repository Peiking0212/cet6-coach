import { ESSAY_TEMPLATES } from '@/sprint/templates'
import type { EssayTemplateId } from '@/sprint/types'

export function SprintTemplatePanel({
  templateId,
  memorize,
}: {
  templateId: EssayTemplateId
  memorize?: boolean
}) {
  const tpl = ESSAY_TEMPLATES[templateId]
  return (
    <div className="sprint-template card">
      <div className="sprint-template-head">
        <span className="pill">{tpl.name}</span>
        {memorize && <span className="pill">背诵</span>}
        <span className="sprint-template-usage">{tpl.usage}</span>
      </div>
      {tpl.sections.map((sec) => (
        <div key={sec.title} className="sprint-template-section">
          <div className="sprint-template-sec-title">{sec.title}</div>
          <p className="sprint-template-sec-body">{sec.content}</p>
        </div>
      ))}
    </div>
  )
}
