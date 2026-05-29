import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './Layout'
import { useApplyTheme } from './useTheme'
import { useStore } from '@/store/StoreProvider'
import { HomePage } from '@/pages/HomePage'
import { ReviewPage } from '@/pages/ReviewPage'
import { ChatPage } from '@/pages/ChatPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MicroLearnPage } from '@/pages/MicroLearnPage'
import { PlacementFlow } from '@/placement/PlacementFlow'
import { EncourageProvider } from '@/components/EncourageProvider'
import { VocabularyPage } from '@/modules/vocabulary/VocabularyPage'
import { ListeningPage } from '@/modules/listening/ListeningPage'
import { TranslationPage } from '@/modules/translation/TranslationPage'
import { ReadingPage } from '@/modules/reading/ReadingPage'
import { WritingPage } from '@/modules/writing/WritingPage'

export function App() {
  useApplyTheme()
  const { state } = useStore()
  const [placementDismissed, setPlacementDismissed] = useState(false)
  const showPlacement = !state.placementDone && !placementDismissed

  useEffect(() => {
    if (!state.placementDone) setPlacementDismissed(false)
  }, [state.placementDone])

  return (
    <EncourageProvider>
      {showPlacement && <PlacementFlow onDone={() => setPlacementDismissed(true)} />}
      <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/micro" element={<MicroLearnPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/listening" element={<ListeningPage />} />
        <Route path="/translation" element={<TranslationPage />} />
        <Route path="/reading" element={<ReadingPage />} />
        <Route path="/writing" element={<WritingPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
    </EncourageProvider>
  )
}
