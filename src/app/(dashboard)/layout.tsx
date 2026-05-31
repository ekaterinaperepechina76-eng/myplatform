import { Sidebar } from '@/components/layout/Sidebar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { AuthProvider } from '@/contexts/AuthContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuthProvider>
  )
}
