import { createClient, type Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { LoginService } from "./generated/login_pb";
import { LeaderboardService } from "./generated/leaderboard_pb";
import { TriviaService } from "./generated/trivia_pb";
import { GuessThatSongService } from "./generated/guessthatsong_pb";
import { PlayerService } from "./generated/player_pb";

const apiUrl = import.meta.env.VITE_BASE_API_URL; // direct api

// Use gRPC-web transport as the Go backend uses gRPC
export const transport: Transport = createConnectTransport({
  baseUrl: apiUrl,
  interceptors: [
    (next) => async (req) => {
      // Add authorization token if available
      const token = localStorage.getItem("auth_token");
      if (token) {
        req.header.set("Authorization", `Bearer ${token}`);
      }
      return await next(req);
    },
  ],
});

// Create the client using the generated service definition and the transport
export const loginClient = createClient(LoginService, transport);
export const leaderboardClient = createClient(LeaderboardService, transport);
export const triviaClient = createClient(TriviaService, transport);
export const guessThatSongClient = createClient(
  GuessThatSongService,
  transport,
);
export const playerClient = createClient(PlayerService, transport);
