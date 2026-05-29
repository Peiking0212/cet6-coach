import { IconStar } from '@/app/icons'

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} 星`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < value ? 'star on' : 'star'}>
          <IconStar size={size} filled={i < value} />
        </span>
      ))}
    </span>
  )
}
