import { useState } from "react";
import { Dashboard } from "@/components/Dashboard";
import { CreateTrivia } from "@/pages/CreateTrivia";
import { UpdateTrivia } from "@/pages/UpdateTrivia";
import { DeleteTrivia } from "@/pages/DeleteTrivia";
import { CreateSong } from "@/pages/CreateSong";
import { UpdateSong } from "@/pages/UpdateSong";
import { DeleteSong } from "@/pages/DeleteSong";
import { Leaderboard } from "@/pages/Leaderboard";
import "./App.css";

type PageType =
  | "trivia-create"
  | "trivia-update"
  | "trivia-delete"
  | "guess-song-create"
  | "guess-song-update"
  | "guess-song-delete"
  | "leaderboard";

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("trivia-create");

  const renderPage = () => {
    switch (currentPage) {
      case "trivia-create":
        return <CreateTrivia />;
      case "trivia-update":
        return <UpdateTrivia />;
      case "trivia-delete":
        return <DeleteTrivia />;
      case "guess-song-create":
        return <CreateSong />;
      case "guess-song-update":
        return <UpdateSong />;
      case "guess-song-delete":
        return <DeleteSong />;
      case "leaderboard":
        return <Leaderboard />;
      default:
        return <CreateTrivia />;
    }
  };

  return (
    <Dashboard currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Dashboard>
  );
}

export default App;
