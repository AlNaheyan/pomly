import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ModeToggle } from "./mode-toggle"
import { signOut } from "@/app/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/utils/supabase/server"
import { User, LogOut, Settings, ChevronDown } from "lucide-react"

const Navbar = async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user initials for avatar fallback
  const getUserInitials = (name: string, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
        .slice(0, 2)
    }
    return email.split("@")[0].charAt(0).toUpperCase()
  }

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
      <div className="container p-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/nav-icon.png"
            alt="Pomly Logo"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="relative h-10 w-auto px-3 rounded-full hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 ">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || "User"}
                      />
                      <AvatarFallback className="text-xs font-medium">
                        {getUserInitials(user.user_metadata?.name, user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" sideOffset={8} align="end">
                <div className="flex items-center gap-3 p-2 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.email || "User"}
                    />
                    <AvatarFallback className="text-sm font-medium">
                      {getUserInitials(user.user_metadata?.name, user.email || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {user.user_metadata?.name || "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="p-0" asChild>
                  <form action={signOut} className="w-full">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 px-2 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      type="submit"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

export default Navbar
