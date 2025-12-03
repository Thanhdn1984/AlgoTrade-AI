// This file is empty in the original code.
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Bot,
  Cpu,
  Database,
  LayoutDashboard,
  Settings,
  Signal,
  Tag,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/datasets", icon: Database, label: "Datasets" },
  { href: "/signals", icon: Signal, label: "AI Signals" },
  { href: "/models", icon: Cpu, label: "Models" },
  { href: "/execution", icon: Bot, label: "Execution" },
];

type SidebarNavProps = {
  isCollapsed?: boolean;
  isMobile?: boolean;
};

export function SidebarNav({ isCollapsed, isMobile = false }: SidebarNavProps) {
  const pathname = usePathname();

  const renderLink = (item: (typeof navItems)[0]) => {
    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary",
          isCollapsed && "justify-center"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className={cn(isCollapsed && "sr-only")}>{item.label}</span>
      </Link>
    );
  };

  const renderTooltipLink = (item: (typeof navItems)[0]) => {
     const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
    return (
      <Tooltip key={item.href} delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
              isActive && "bg-accent text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };
  
  if (isMobile) {
    return (
         <nav className="grid gap-2 text-lg font-medium p-4">
            {navItems.map(renderLink)}
        </nav>
    )
  }

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            {navItems.map(renderTooltipLink)}
        </nav>
      </TooltipProvider>
    );
  }

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map(renderLink)}
    </nav>
  );
}
