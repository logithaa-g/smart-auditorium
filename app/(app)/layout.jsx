import { AuthProvider } from '@/components/AuthProvider'
import AppLayout from '@/components/AppLayout'

export default function PagesLayout({ children }) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  )
}
