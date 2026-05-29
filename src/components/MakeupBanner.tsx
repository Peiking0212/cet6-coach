import { useStore } from '@/store/StoreProvider'
import { canOfferMakeup } from '@/store/streak'

export function MakeupBanner() {
  const { state, useMakeup } = useStore()
  if (!canOfferMakeup(state)) return null

  return (
    <div className="makeup-banner card">
      <span>昨天断签了？本周可用一次补签卡恢复连续打卡 🔖</span>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => useMakeup()}>
        使用补签卡
      </button>
    </div>
  )
}
