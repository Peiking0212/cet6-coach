import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Short label for where the error occurred, e.g. "单词" */
  label?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info)
  }

  private reload = () => {
    window.location.reload()
  }

  private goHome = () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    window.location.href = `${base}/`
  }

  render() {
    if (!this.state.error) return this.props.children

    const msg = this.state.error.message || '未知错误'
    return (
      <div className="card error-boundary fade-in">
        <div className="error-boundary-emoji">⚠️</div>
        <h2 className="error-boundary-title">
          {this.props.label ? `${this.props.label}页面出错` : '页面出错'}
        </h2>
        <p className="error-boundary-msg">{msg}</p>
        <p className="error-boundary-hint">
          可尝试刷新或返回首页。若刚更新过 App，请清除浏览器缓存后重试。
        </p>
        <div className="error-boundary-actions">
          <button type="button" className="btn btn-ghost" onClick={this.goHome}>
            返回首页
          </button>
          <button type="button" className="btn btn-primary" onClick={this.reload}>
            刷新页面
          </button>
        </div>
      </div>
    )
  }
}
