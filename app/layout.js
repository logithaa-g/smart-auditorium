import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata = {
  title: 'Smart Auditorium Booking System',
  description: 'College Auditorium & Seminar Hall Booking System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontSize: '14px' },
          }}
        />
      </body>
    </html>
  )
}
