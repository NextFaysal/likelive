"use client"

import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/shared/Navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </SessionProvider>
  )
}
