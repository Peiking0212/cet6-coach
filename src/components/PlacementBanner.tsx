import { useStore } from '@/store/StoreProvider'
import { usePlacement } from '@/placement/PlacementProvider'

export function PlacementBanner() {
  const { state, dismissPlacementBanner } = useStore()
  const { openPlacement } = usePlacement()

  if (state.placementDone || state.placementBannerDismissed) return null

  return (
    <div className="placement-banner card">
      <span>想精准推荐？完成 3 分钟摸底</span>
      <div className="placement-banner-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={openPlacement}>
          开始摸底
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismissPlacementBanner}>
          跳过
        </button>
      </div>
    </div>
  )
}
