"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bot,
  CircleUser,
  LogOut,
  Moon,
  PanelLeft,
  Settings,
  Sun,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";

const getTitleFromPathname = (pathname: string) => {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/datasets')) return 'Datasets';
  if (pathname.startsWith('/data-sources')) return 'Data Sources';
  if (pathname.startsWith('/signals')) return 'AI Signals';
  if (pathname.startsWith('/models')) return 'Models';
  if (pathname.startsWith('/execution')) return 'Execution';
  return 'AlgoTrade AI';
};

export function Header() {
  const pathname = usePathname();
  const title = getTitleFromPathname(pathname);
  const { setTheme, theme } = useTheme();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs bg-card p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
               <Bot className="h-6 w-6 mr-2 text-primary" />
               <span className="font-headline font-semibold text-lg">AlgoTrade AI</span>
            </div>
            <nav className="flex-1 overflow-y-auto">
               <SidebarNav isMobile={true} />
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="flex-1 text-xl font-semibold font-headline tracking-tight">{title}</h1>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="rounded-full"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="@shadcn" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <CircleUser className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
