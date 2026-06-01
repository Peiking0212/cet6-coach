import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './Layout'
import { useApplyTheme } from './useTheme'
import { HomePage } from '@/pages/HomePage'
import { ReviewPage } from '@/pages/ReviewPage'
import { ChatPage } from '@/pages/ChatPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { MicroLearnPage } from '@/pages/MicroLearnPage'
import { PlacementProvider } from '@/placement/PlacementProvider'
import { EncourageProvider } from '@/components/EncourageProvider'
import { VocabularyPage } from '@/modules/vocabulary/VocabularyPage'
import { ListeningPage } from '@/modules/listening/ListeningPage'
import { TranslationPage } from '@/modules/translation/TranslationPage'
import { ReadingPage } from '@/modules/reading/ReadingPage'
import { WritingPage } from '@/modules/writing/WritingPage'
import { SprintOverviewPage } from '@/modules/sprint/SprintOverviewPage'
import { SprintDayRoute, SprintTodayRoute } from '@/modules/sprint/SprintDayFlow'
import { SprintDaySummary } from '@/modules/sprint/SprintDaySummary'

export function App() {
  useApplyTheme()

  return (
    <EncourageProvider>
      <PlacementProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/micro" element={<MicroLearnPage />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/listening" element={<ListeningPage />} />
            <Route path="/translation" element={<TranslationPage />} />
            <Route path="/reading" element={<ReadingPage />} />
            <Route path="/writing" element={<WritingPage />} />
            <Route path="/sprint" element={<SprintOverviewPage />} />
            <Route path="/sprint/today" element={<SprintTodayRoute />} />
            <Route path="/sprint/day/:day" element={<SprintDayRoute />} />
            <Route path="/sprint/day/:day/summary" element={<SprintDaySummary />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </PlacementProvider>
    </EncourageProvider>
  )
}
