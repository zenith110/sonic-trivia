import { useState } from "react";
import {
  Home,
  Trophy,
  LogOut,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  ListChecks,
  Music,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

type PageType =
  | "main-menu"
  | "trivia-create"
  | "trivia-update"
  | "trivia-delete"
  | "guess-song-create"
  | "guess-song-update"
  | "guess-song-delete"
  | "leaderboard";

interface DashboardProps {
  children?: React.ReactNode;
  currentPage?: PageType;
  onPageChange?: (page: PageType) => void;
  onBackToMenu?: () => void;
}

export function Dashboard({
  children,
  currentPage,
  onPageChange,
  onBackToMenu,
}: DashboardProps) {
  const [activePage, setActivePage] = useState<PageType>(
    currentPage || "main-menu",
  );
  const [isTriviaOpen, setIsTriviaOpen] = useState(true);
  const [isGuessSongOpen, setIsGuessSongOpen] = useState(false);

  const handlePageChange = (page: PageType) => {
    setActivePage(page);
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            {user && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">
                    {user.displayName || user.username}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Score: {user.totalScore} • Role: {user.role}
                  </span>
                </div>
              </div>
            )}
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Back to Main Menu */}
                  {onBackToMenu && (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton onClick={onBackToMenu}>
                          <Home className="h-4 w-4" />
                          <span>Back to Main Menu</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <Separator className="my-2" />
                    </>
                  )}

                  {/* Trivia Section with Collapsible */}
                  <Collapsible
                    open={isTriviaOpen}
                    onOpenChange={setIsTriviaOpen}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className="w-full"
                          isActive={activePage.startsWith("trivia")}
                        >
                          <ListChecks className="h-4 w-4" />
                          <span>Trivia</span>
                          <ChevronDown
                            className={`ml-auto h-4 w-4 transition-transform ${
                              isTriviaOpen ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>

                    <CollapsibleContent className="ml-4 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("trivia-create")}
                          isActive={activePage === "trivia-create"}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Trivia</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("trivia-update")}
                          isActive={activePage === "trivia-update"}
                        >
                          <Edit className="h-4 w-4" />
                          <span>Update Trivia</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("trivia-delete")}
                          isActive={activePage === "trivia-delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Trivia</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Guess the Song Section with Collapsible */}
                  <Collapsible
                    open={isGuessSongOpen}
                    onOpenChange={setIsGuessSongOpen}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className="w-full"
                          isActive={activePage.startsWith("guess-song")}
                        >
                          <Music className="h-4 w-4" />
                          <span>Guess the Song</span>
                          <ChevronDown
                            className={`ml-auto h-4 w-4 transition-transform ${
                              isGuessSongOpen ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>

                    <CollapsibleContent className="ml-4 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("guess-song-create")}
                          isActive={activePage === "guess-song-create"}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Song</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("guess-song-update")}
                          isActive={activePage === "guess-song-update"}
                        >
                          <Edit className="h-4 w-4" />
                          <span>Update Song</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("guess-song-delete")}
                          isActive={activePage === "guess-song-delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Song</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Leaderboard */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handlePageChange("leaderboard")}
                      isActive={activePage === "leaderboard"}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Leaderboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <Separator className="my-2" />

                  {/* Sign Out */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleSignOut}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold capitalize">
                {activePage.replace("-", " ")}
              </h1>
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
