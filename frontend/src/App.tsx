import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { CreateTrivia } from "@/pages/CreateTrivia";
import { UpdateTrivia } from "@/pages/UpdateTrivia";
import { DeleteTrivia } from "@/pages/DeleteTrivia";
import { TriviaCollections } from "@/pages/TriviaCollections";
import { CreateSong } from "@/pages/CreateSong";
import { UpdateSong } from "@/pages/UpdateSong";
import { DeleteSong } from "@/pages/DeleteSong";
import { SongCollections } from "@/pages/SongCollections";
import { Leaderboard } from "@/pages/Leaderboard";
import { MainMenu } from "@/pages/MainMenu";
import { ProfilePage } from "@/pages/ProfilePage";
import { ApprovalQueue } from "@/pages/ApprovalQueue";
import { SearchPage } from "@/pages/SearchPage";
import { BrowseQuestions } from "@/pages/BrowseQuestions";
import { BrowseSongs } from "@/pages/BrowseSongs";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

type PageType =
  | "main-menu"
  | "dashboard"
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

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("main-menu");
  const [dashboardPage, setDashboardPage] =
    useState<Exclude<PageType, "main-menu" | "dashboard">>("trivia-create");

  const handleDashboardPageChange = (page: PageType) => {
    if (page !== "main-menu" && page !== "dashboard") {
      setDashboardPage(page);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "main-menu":
        return (
          <MainMenu
            onNavigateToDashboard={() => setCurrentPage("dashboard")}
            onNavigateToLeaderboard={() => setCurrentPage("leaderboard")}
            onNavigateToProfile={() => setCurrentPage("profile")}
          />
        );
      case "profile":
        return <ProfilePage onBack={() => setCurrentPage("main-menu")} />;
      case "dashboard":
        return (
          <Dashboard
            currentPage={dashboardPage}
            onPageChange={handleDashboardPageChange}
            onBackToMenu={() => setCurrentPage("main-menu")}
          >
            {renderDashboardPage()}
          </Dashboard>
        );
      case "leaderboard":
        return <Leaderboard onBack={() => setCurrentPage("main-menu")} />;
      case "search":
        return (
          <Dashboard
            currentPage="search"
            onPageChange={handleDashboardPageChange}
            onBackToMenu={() => setCurrentPage("main-menu")}
          >
            <SearchPage />
          </Dashboard>
        );
      case "browse-questions":
        return (
          <Dashboard
            currentPage="browse-questions"
            onPageChange={handleDashboardPageChange}
            onBackToMenu={() => setCurrentPage("main-menu")}
          >
            <BrowseQuestions />
          </Dashboard>
        );
      case "browse-songs":
        return (
          <Dashboard
            currentPage="browse-songs"
            onPageChange={handleDashboardPageChange}
            onBackToMenu={() => setCurrentPage("main-menu")}
          >
            <BrowseSongs />
          </Dashboard>
        );
      default:
        return (
          <MainMenu
            onNavigateToDashboard={() => setCurrentPage("dashboard")}
            onNavigateToLeaderboard={() => setCurrentPage("leaderboard")}
            onNavigateToProfile={() => setCurrentPage("profile")}
          />
        );
    }
  };

  const renderDashboardPage = () => {
    switch (dashboardPage) {
      case "trivia-create":
        return <CreateTrivia />;
      case "trivia-update":
        return <UpdateTrivia />;
      case "trivia-delete":
        return <DeleteTrivia />;
      case "trivia-collections":
        return <TriviaCollections />;
      case "guess-song-create":
        return <CreateSong />;
      case "guess-song-update":
        return <UpdateSong />;
      case "guess-song-delete":
        return <DeleteSong />;
      case "guess-song-collections":
        return <SongCollections />;
      case "leaderboard":
        return <Leaderboard />;
      case "approval-queue":
        return <ApprovalQueue />;
      case "search":
        return <SearchPage />;
      case "browse-questions":
        return <BrowseQuestions />;
      case "browse-songs":
        return <BrowseSongs />;
      default:
        return <CreateTrivia />;
    }
  };

  return (
    <ProtectedRoute>
      {renderPage()}
      <Toaster />
    </ProtectedRoute>
  );
}

export default App;
