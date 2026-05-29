import type { ReactNode } from 'react'

type P = { size?: number }
const wrap = (size: number, children: ReactNode) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

export const IconHome = ({ size = 22 }: P) =>
  wrap(size, <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>)

export const IconListen = ({ size = 22 }: P) =>
  wrap(
    size,
    <>
      <path d="M3 12a9 9 0 0 1 18 0" />
      <rect x="3" y="12" width="4" height="7" rx="2" />
      <rect x="17" y="12" width="4" height="7" rx="2" />
    </>,
  )

export const IconTranslate = ({ size = 22 }: P) =>
  wrap(
    size,
    <>
      <path d="M4 5h7" />
      <path d="M7 4v2c0 3.5-2 6-4 7" />
      <path d="M5 9c.5 2 2.5 3.5 5 4" />
      <path d="m12 20 4-9 4 9" />
      <path d="M13.5 17h5" />
    </>,
  )

export const IconRead = ({ size = 22 }: P) =>
  wrap(
    size,
    <>
      <path d="M12 6c-1.5-1.2-3.8-2-6-2-1 0-2 .2-3 .5V19c1-.3 2-.5 3-.5 2.2 0 4.5.8 6 2" />
      <path d="M12 6c1.5-1.2 3.8-2 6-2 1 0 2 .2 3 .5V19c-1-.3-2-.5-3-.5-2.2 0-4.5.8-6 2" />
      <path d="M12 6v15" />
    </>,
  )

export const IconWrite = ({ size = 22 }: P) =>
  wrap(
    size,
    <>
      <path d="M14 4l6 6L9 21H3v-6L14 4z" />
      <path d="M12.5 5.5 18.5 11.5" />
    </>,
  )

export const IconReview = ({ size = 22 }: P) =>
  wrap(
    size,
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </>,
  )

export const IconChat = ({ size = 22 }: P) =>
  wrap(size, <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 21 12z" />)

export const IconSettings = ({ size = 22 }: P) =>
  wrap(
    size,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 9 1.1V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </>,
  )

export const IconStar = ({ size = 16, filled = false }: P & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
  </svg>
)

export const IconFlame = ({ size = 16 }: P) =>
  wrap(size, <path d="M12 3c0 3-4 4-4 8a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 2 1 4 3 4 6a7 7 0 1 1-14 0c0-4 5-6 7-10z" />)

export const IconPlay = ({ size = 22 }: P) =>
  wrap(size, <path d="M6 4l14 8-14 8z" />)

export const IconVocab = ({ size = 22 }: P) =>
  wrap(
    size,
    <>
      <path d="M4 5a2 2 0 0 1 2-2h7v18H6a2 2 0 0 1-2-2z" />
      <path d="M13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
      <path d="M7.5 8h3M7.5 11.5h3" />
    </>,
  )

export const IconSearch = ({ size = 22 }: P) =>
  wrap(size, <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>)

export const IconSun = ({ size = 20 }: P) =>
  wrap(
    size,
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
  )

export const IconMoon = ({ size = 20 }: P) =>
  wrap(size, <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)
