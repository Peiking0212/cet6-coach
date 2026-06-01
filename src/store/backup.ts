import type { StoreState } from './types'
import { makeDefaultState, STORE_VERSION, todayStr } from './defaults'

export const BACKUP_FILE_PREFIX = 'cet6-coach-backup'
export const BACKUP_APP_ID = 'cet6-coach'
export const BACKUP_FORMAT_VERSION = 1

export interface BackupFile {
  backupVersion: number
  exportedAt: string
  app: string
  state: Partial<StoreState> & { version?: number }
}

export type BackupValidationResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string }

export type ImportResult =
  | { ok: true; state: StoreState }
  | { ok: false; error: string }

const REQUIRED_STATE_KEYS: (keyof StoreState)[] = [
  'stats',
  'progress',
  'review',
  'daily',
]

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function hasRequiredStateKeys(state: Record<string, unknown>): boolean {
  return REQUIRED_STATE_KEYS.every((k) => k in state)
}

/** Merge persisted or imported partial state onto current defaults. */
export function mergeImportedState(parsed: Partial<StoreState> | null): StoreState {
  const base = makeDefaultState()
  if (!parsed) return base
  return {
    ...base,
    ...parsed,
    version: STORE_VERSION,
    stats: { ...base.stats, ...(parsed.stats ?? {}) },
    progress: { ...base.progress, ...(parsed.progress ?? {}) },
    daily: { ...base.daily, ...(parsed.daily ?? {}) },
    ai: { ...base.ai, ...(parsed.ai ?? {}) },
    vocab: parsed.vocab ?? {},
    review: Array.isArray(parsed.review) ? parsed.review : [],
    placementDone: parsed.placementDone ?? false,
    placementLevel: parsed.placementLevel ?? null,
    placementBannerDismissed: parsed.placementBannerDismissed ?? false,
    moduleDifficulty: { ...base.moduleDifficulty, ...(parsed.moduleDifficulty ?? {}) },
    placementBaseline: { ...base.placementBaseline, ...(parsed.placementBaseline ?? {}) },
    streak: { ...base.streak, ...(parsed.streak ?? {}) },
    makeup: { ...base.makeup, ...(parsed.makeup ?? {}) },
    coach: { ...base.coach, ...(parsed.coach ?? {}) },
    sprint: { ...base.sprint, ...(parsed.sprint ?? {}) },
  }
}

function migrateState(state: Partial<StoreState>): Partial<StoreState> {
  const fromVersion = state.version ?? 1
  let next: Partial<StoreState> = { ...state }

  if (fromVersion < 2) {
    next = {
      ...next,
      vocab: next.vocab ?? {},
      placementDone: next.placementDone ?? false,
      placementLevel: next.placementLevel ?? null,
      moduleDifficulty: next.moduleDifficulty,
      placementBaseline: next.placementBaseline,
    }
  }

  if (fromVersion < 3) {
    const base = makeDefaultState()
    next = {
      ...next,
      moduleDifficulty: { ...base.moduleDifficulty, ...(next.moduleDifficulty ?? {}) },
      placementBaseline: { ...base.placementBaseline, ...(next.placementBaseline ?? {}) },
      streak: { ...base.streak, ...(next.streak ?? {}) },
      makeup: { ...base.makeup, ...(next.makeup ?? {}) },
      coach: { ...base.coach, ...(next.coach ?? {}) },
    }
  }

  if (fromVersion < 4) {
    const base = makeDefaultState()
    next = {
      ...next,
      sprint: { ...base.sprint, ...(next.sprint ?? {}) },
    }
  }

  return next
}

export function validateBackup(raw: unknown): BackupValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, error: '无效的文件格式' }
  }

  // Wrapped backup file
  if ('state' in raw && isRecord(raw.state)) {
    if (raw.app !== undefined && raw.app !== BACKUP_APP_ID) {
      return { ok: false, error: '不是 cet6-coach 的备份文件' }
    }
    if (!hasRequiredStateKeys(raw.state)) {
      return { ok: false, error: '备份缺少必要的学习进度字段' }
    }
    const version = raw.state.version
    if (typeof version === 'number' && version > STORE_VERSION) {
      return { ok: false, error: '备份来自较新版本，请先升级 App 后再导入' }
    }
    return {
      ok: true,
      backup: {
        backupVersion: typeof raw.backupVersion === 'number' ? raw.backupVersion : 1,
        exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
        app: typeof raw.app === 'string' ? raw.app : BACKUP_APP_ID,
        state: raw.state as BackupFile['state'],
      },
    }
  }

  // Raw store JSON (legacy / manual)
  if (hasRequiredStateKeys(raw)) {
    const version = raw.version
    if (typeof version === 'number' && version > STORE_VERSION) {
      return { ok: false, error: '备份来自较新版本，请先升级 App 后再导入' }
    }
    return {
      ok: true,
      backup: {
        backupVersion: 1,
        exportedAt: '',
        app: BACKUP_APP_ID,
        state: raw as BackupFile['state'],
      },
    }
  }

  return { ok: false, error: '无法识别的备份格式' }
}

export interface ExportOptions {
  /** Include API Key in export (baseURL / model always included). */
  includeApiKey?: boolean
}

export function exportState(state: StoreState, options: ExportOptions = {}): BackupFile {
  const { includeApiKey = false } = options
  return {
    backupVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    app: BACKUP_APP_ID,
    state: {
      ...state,
      ai: {
        ...state.ai,
        apiKey: includeApiKey ? state.ai.apiKey : '',
      },
    },
  }
}

export function downloadBackup(backup: BackupFile): void {
  const filename = `${BACKUP_FILE_PREFIX}-${todayStr()}.json`
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function importState(raw: unknown, currentState: StoreState): ImportResult {
  const validated = validateBackup(raw)
  if (!validated.ok) return validated

  const migrated = migrateState(validated.backup.state)
  const merged = mergeImportedState(migrated)

  const importedKey = validated.backup.state.ai?.apiKey
  if (!importedKey && currentState.ai.apiKey) {
    merged.ai = { ...merged.ai, apiKey: currentState.ai.apiKey }
  }

  return { ok: true, state: merged }
}
