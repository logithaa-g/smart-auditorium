import { AuthProvider } from '@/components/AuthProvider'

export default function LoginLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}
