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
  FolderPlus,
  Shield,
  Circle,
  Search,
} from "lucide-react";
import { getCharacterById, getCharacterImagePath } from "@/data/characters";
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
  | "trivia-collections"
  | "guess-song-create"
  | "guess-song-update"
  | "guess-song-delete"
  | "guess-song-collections"
  | "leaderboard"
  | "profile"
  | "approval-queue"
  | "search"
  | "browse-questions"
  | "browse-songs";

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

  // Check if user has admin/moderator permissions
  const hasApprovalPermissions =
    user?.role === "admin" || user?.role === "moderator";

  const handleSignOut = () => {
    logout();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            {user && (
              <div className="mt-4 flex items-start gap-3 rounded-lg bg-muted p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {user.selectedCharacterId ? (
                    (() => {
                      const character = getCharacterById(
                        user.selectedCharacterId,
                      );
                      return character ? (
                        <img
                          src={getCharacterImagePath(character)}
                          alt={character.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.className =
                                "flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground";
                              parent.innerHTML =
                                '<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                            }
                          }}
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary-foreground" />
                      );
                    })()
                  ) : (
                    <User className="h-6 w-6 text-primary-foreground" />
                  )}
                </div>
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user.displayName || user.username}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                  {user.selectedCharacterId &&
                    (() => {
                      const character = getCharacterById(
                        user.selectedCharacterId,
                      );
                      return character ? (
                        <span className="text-xs text-blue-600 font-medium truncate">
                          Playing as {character.name}
                        </span>
                      ) : null;
                    })()}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-yellow-600" />
                      Score: {user.totalScore.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      Rings: {user.totalRings.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      Role: {user.role}
                    </span>
                  </div>
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

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("trivia-collections")}
                          isActive={activePage === "trivia-collections"}
                        >
                          <FolderPlus className="h-4 w-4" />
                          <span>Collections</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("browse-questions")}
                          isActive={activePage === "browse-questions"}
                        >
                          <Search className="h-4 w-4" />
                          <span>Search Questions</span>
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

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() =>
                            handlePageChange("guess-song-collections")
                          }
                          isActive={activePage === "guess-song-collections"}
                        >
                          <FolderPlus className="h-4 w-4" />
                          <span>Collections</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => handlePageChange("browse-songs")}
                          isActive={activePage === "browse-songs"}
                        >
                          <Search className="h-4 w-4" />
                          <span>Search Songs</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Search & Browse */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handlePageChange("search")}
                      isActive={activePage === "search"}
                    >
                      <Search className="h-4 w-4" />
                      <span>Search & Browse</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

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

                  {/* Approval Queue - Only for admin/moderator */}
                  {hasApprovalPermissions && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => handlePageChange("approval-queue")}
                        isActive={activePage === "approval-queue"}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Shield className="h-4 w-4" />
                        <span>Approval Queue</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

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
