import { useEffect, useState } from "react";
import { Bell, Search, Check, LogOut, User, Settings, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ProfileDialog } from "@/components/shared/profile-dialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/sidebar-context";

const HEADING_FONT = "'Bebas Neue', sans-serif";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function TopBar({ title }: { title: string }) {
  const router = useRouter();
  const { logout } = useAuth();
  const { toggleSidebar, isCollapsed } = useSidebar();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);


  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { readAll: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b-4 border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={toggleSidebar}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
        <h2 className="text-xl font-black uppercase tracking-widest flex-shrink-0" style={{ fontFamily: HEADING_FONT }}>
          {title}
        </h2>
        <div className="flex-1" />
        
        <div className="hidden md:flex items-center max-w-sm flex-1">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search logs or members..." className="pl-9 h-9 border-2 border-muted focus-visible:ring-0 focus-visible:border-primary transition-colors font-bold text-xs uppercase" />
          </div>
        </div>

        <Popover>
          <PopoverTrigger className="relative flex h-9 w-9 items-center justify-center rounded-lg border-2 border-muted hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer outline-none">
            <Bell size={20} className={unreadCount > 0 ? "text-primary animate-pulse" : ""} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-primary text-primary-foreground font-black border-2 border-background">
                {unreadCount}
              </Badge>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 overflow-hidden border-4 border-muted" align="end">
            <div className="p-4 bg-muted flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-tighter" style={{ fontFamily: HEADING_FONT }}>Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAsRead()} className="h-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors">
                  <Check size={12} /> Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-72">
              {notifications.length > 0 ? (
                <div className="grid divide-y divide-muted">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 transition-colors ${!n.read ? 'bg-primary/5 border-l-4 border-primary' : 'bg-transparent border-l-4 border-transparent'}`}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <p className="font-black text-xs uppercase tracking-tight leading-none mb-1">{n.title}</p>
                      <p className="text-[11px] font-medium text-muted-foreground leading-snug">{n.message}</p>
                      <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-2">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/20">
                  <Bell size={32} className="text-muted-foreground/20 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inbox Zero</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger className="h-9 w-9 rounded-full border-2 border-muted hover:border-primary transition-colors cursor-pointer outline-none overflow-hidden">
            <Avatar className="h-full w-full">
              <AvatarFallback className="text-[10px] font-black bg-muted text-foreground uppercase tracking-widest">SR</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 border-4 border-muted shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-black uppercase tracking-tighter text-xs">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted" />
              <DropdownMenuItem 
                onClick={() => setIsProfileOpen(true)}
                className="font-bold uppercase text-[10px] tracking-widest cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-muted" />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                className="font-black uppercase text-[10px] tracking-widest text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </header>
  );
}
