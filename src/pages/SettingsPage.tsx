import { useRef, useState } from 'react'
import { useStore } from '@/store/StoreProvider'
import { usePlacement } from '@/placement/PlacementProvider'
import { downloadBackup, exportState, importState } from '@/store/backup'
import { PageHeader } from '@/components/PageHeader'
import { aiConfigured, AiError, chat } from '@/ai/client'
import type { ThemeMode } from '@/store/types'

const PRESETS: { label: string; baseURL: string; model: string }[] = [
  { label: 'OpenAI', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: '通义千问', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { label: '智谱 GLM', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { label: 'Kimi', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
]

const THEMES: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: '粉色' },
  { key: 'dark', label: '暗色' },
  { key: 'system', label: '跟随系统' },
]

export function SettingsPage() {
  const { state, setAi, setTheme, setGoal, reset, resetPlacement, importProgress } = useStore()
  const { openPlacement } = usePlacement()
  const ai = state.ai
  const fileRef = useRef<HTMLInputElement>(null)
  const [includeApiKey, setIncludeApiKey] = useState(false)
  const [backupMsg, setBackupMsg] = useState<{ kind: 'ok' | 'fail'; text: string } | null>(null)
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [testMsg, setTestMsg] = useState('')

  const showBackupMsg = (kind: 'ok' | 'fail', text: string) => {
    setBackupMsg({ kind, text })
    window.setTimeout(() => setBackupMsg(null), 2800)
  }

  const handleExport = () => {
    const backup = exportState(state, { includeApiKey })
    downloadBackup(backup)
    showBackupMsg('ok', '进度已导出，请保存到微信或网盘')
  }

  const handleImportClick = () => {
    fileRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!confirm('将覆盖当前进度，是否继续？')) return

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      const result = importState(parsed, state)
      if (!result.ok) {
        showBackupMsg('fail', result.error)
        return
      }
      importProgress(result.state)
      showBackupMsg('ok', '学习进度已恢复')
    } catch {
      showBackupMsg('fail', '文件解析失败，请确认是有效的 JSON 备份')
    }
  }

  const test = async () => {
    setTestState('testing')
    setTestMsg('')
    try {
      const reply = await chat(ai, [
        { role: 'user', content: '只回复两个字：你好' },
      ])
      setTestState('ok')
      setTestMsg(`连接成功：${reply.slice(0, 40)}`)
    } catch (e) {
      setTestState('fail')
      setTestMsg(e instanceof AiError ? e.message : '连接失败')
    }
  }

  return (
    <div>
      <PageHeader title="设置" subtitle="AI 配置、主题与学习目标" />

      <section className="card setting-section">
        <h3 className="setting-h">主题外观</h3>
        <div className="seg">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`seg-btn${state.theme === t.key ? ' active' : ''}`}
              onClick={() => setTheme(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card setting-section">
        <h3 className="setting-h">每日目标</h3>
        <div className="goal-setter">
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={state.daily.goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
          <span className="goal-val">{state.daily.goal} 题 / 天</span>
        </div>
      </section>

      <section className="card setting-section">
        <h3 className="setting-h">AI 助手（OpenAI 兼容）</h3>
        <p className="setting-desc">
          支持 OpenAI / DeepSeek / 通义 / 智谱 / Kimi 等。密钥仅保存在本机浏览器，不会上传。
        </p>

        <div className="preset-row">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="chip-btn"
              onClick={() => setAi({ baseURL: p.baseURL, model: p.model })}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Base URL</span>
          <input
            type="text"
            value={ai.baseURL}
            placeholder="https://api.deepseek.com/v1"
            onChange={(e) => setAi({ baseURL: e.target.value })}
          />
        </label>

        <label className="field">
          <span>API Key</span>
          <input
            type="password"
            value={ai.apiKey}
            placeholder="sk-..."
            autoComplete="off"
            onChange={(e) => setAi({ apiKey: e.target.value })}
          />
        </label>

        <label className="field">
          <span>模型 Model</span>
          <input
            type="text"
            value={ai.model}
            placeholder="deepseek-chat"
            onChange={(e) => setAi({ model: e.target.value })}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>采样温度 ({ai.temperature.toFixed(1)})</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={ai.temperature}
              onChange={(e) => setAi({ temperature: Number(e.target.value) })}
            />
          </label>
        </div>

        <label className="field">
          <span>本地代理地址（可选，CORS 兜底）</span>
          <input
            type="text"
            value={ai.proxyURL}
            placeholder="http://localhost:8787"
            onChange={(e) => setAi({ proxyURL: e.target.value })}
          />
        </label>
        <p className="setting-desc">
          若浏览器直连被 CORS 拦截，运行 <code>npm run proxy</code> 后在此填入 <code>http://localhost:8787</code>。
        </p>

        <div className="test-row">
          <button className="btn btn-primary" onClick={test} disabled={!aiConfigured(ai) || testState === 'testing'}>
            {testState === 'testing' ? '测试中…' : '测试连接'}
          </button>
          {testState === 'ok' && <span className="test-ok">✓ {testMsg}</span>}
          {testState === 'fail' && <span className="test-fail">✕ {testMsg}</span>}
        </div>
      </section>

      <section className="card setting-section">
        <h3 className="setting-h">入门定位</h3>
        <p className="setting-desc">
          重新摸底会清除当前等级标签，并立即开始 3–5 分钟定位测试。
        </p>
        <button
          className="btn"
          onClick={() => {
            if (confirm('确定重新摸底？')) {
              resetPlacement()
              openPlacement()
            }
          }}
        >
          重新摸底
        </button>
      </section>

      <section className="card setting-section">
        <h3 className="setting-h">数据备份</h3>
        <p className="setting-desc">
          导出后可存到微信/网盘，换手机时导入恢复。包含积分、关卡、错题、背词进度、连续打卡等全部学习数据。
          Base URL 与模型名会一并导出；API Key 默认不包含，需勾选下方选项。
        </p>

        <label className="backup-check">
          <input
            type="checkbox"
            checked={includeApiKey}
            onChange={(e) => setIncludeApiKey(e.target.checked)}
          />
          <span>同时导出 API Key（请妥善保管备份文件）</span>
        </label>

        <div className="backup-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            导出学习进度
          </button>
          <button className="btn" onClick={handleImportClick}>
            导入学习进度
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="backup-file-input"
            onChange={handleImportFile}
          />
        </div>

        {backupMsg?.kind === 'ok' && <p className="test-ok backup-msg">✓ {backupMsg.text}</p>}
        {backupMsg?.kind === 'fail' && <p className="test-fail backup-msg">✕ {backupMsg.text}</p>}
      </section>

      <section className="card setting-section">
        <h3 className="setting-h">数据</h3>
        <p className="setting-desc">
          所有进度、积分、错题与配置都保存在本机（浏览器为 localStorage；Android APK 为
          Capacitor Preferences，卸载前一般不因关 App 而丢失）。
        </p>
        <button
          className="btn"
          onClick={() => {
            if (confirm('确定清空全部进度、积分与错题？此操作不可恢复。')) reset()
          }}
        >
          清空全部数据
        </button>
      </section>
    </div>
  )
}
