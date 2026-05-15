"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Video, LogOut, Home, FileVideo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Video className="h-5 w-5 text-purple-400" />
          </div>
          <span className="font-bold text-lg">LikeLive</span>
        </Link>

        <div className="flex items-center gap-6">
          {session?.user ? (
            <>
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/recordings"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <FileVideo className="h-4 w-4" />
                Recordings
              </Link>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-500/20 text-purple-400 text-sm">
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-300">
                  {session.user.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
