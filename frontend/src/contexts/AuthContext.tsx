/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, type ReactNode } from "react";
import { create } from "@bufbuild/protobuf";
import { loginClient } from "@/grpc";
import {
  LoginRequestSchema,
  SignUpUsernameOrEmailRequestSchema,
} from "@/generated/login_pb";
import { toNumber } from "@/lib/protobuf-utils";

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  selectedCharacterId?: string;
  totalScore: number;
  totalRings: number;
  gamesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const request = create(LoginRequestSchema, {
        value: {
          case: "email",
          value: email,
        },
        password,
      });

      const response = await loginClient.login(request);
      console.log(response);
      if (response.value?.case === "token" && response.value.value) {
        const jwtToken = response.value.value;

        // Store token immediately
        setToken(jwtToken);
        localStorage.setItem("auth_token", jwtToken);

        // Use player info from response
        if (response.player) {
          const player = response.player;

          // Decode JWT to get user_id
          const tokenParts = jwtToken.split(".");
          let userId = "";
          if (tokenParts.length === 3) {
            try {
              const payload = JSON.parse(atob(tokenParts[1]));
              userId = payload.user_id || "";
            } catch (error) {
              console.error("Failed to parse JWT payload:", error);
            }
          }

          const userData: User = {
            id: userId,
            username: player.name || email.split("@")[0],
            email: player.email || email,
            displayName: player.name || email.split("@")[0],
            role: player.role || "player",
            selectedCharacterId: player.selectedCharacterId || undefined,
            totalScore: player.totalPoints ? toNumber(player.totalPoints) : 0,
            totalRings: player.totalRings ? toNumber(player.totalRings) : 0,
            gamesPlayed: 0,
            questionsAnswered: player.totalAnswers
              ? toNumber(player.totalAnswers)
              : 0,
            correctAnswers: player.totalSuccessfulAnswers
              ? toNumber(player.totalSuccessfulAnswers)
              : 0,
          };

          setUser(userData);
          localStorage.setItem("auth_user", JSON.stringify(userData));
        }
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    setIsLoading(true);
    try {
      const request = create(SignUpUsernameOrEmailRequestSchema, {
        username,
        email,
        password,
      });

      const response = await loginClient.signUpUsernameOrEmail(request);

      if (response.value?.case === "token" && response.value.value) {
        const jwtToken = response.value.value;

        // Store token immediately
        setToken(jwtToken);
        localStorage.setItem("auth_token", jwtToken);

        // Use player info from response
        if (response.player) {
          const player = response.player;

          // Decode JWT to get user_id
          const tokenParts = jwtToken.split(".");
          let userId = "";
          if (tokenParts.length === 3) {
            try {
              const payload = JSON.parse(atob(tokenParts[1]));
              userId = payload.user_id || "";
            } catch (error) {
              console.error("Failed to parse JWT payload:", error);
            }
          }

          const userData: User = {
            id: userId,
            username: player.name || username,
            email: player.email || email,
            displayName: player.name || username,
            role: player.role || "player",
            selectedCharacterId: player.selectedCharacterId || undefined,
            totalScore: player.totalPoints ? toNumber(player.totalPoints) : 0,
            totalRings: player.totalRings ? toNumber(player.totalRings) : 0,
            gamesPlayed: 0,
            questionsAnswered: player.totalAnswers
              ? toNumber(player.totalAnswers)
              : 0,
            correctAnswers: player.totalSuccessfulAnswers
              ? toNumber(player.totalSuccessfulAnswers)
              : 0,
          };

          setUser(userData);
          localStorage.setItem("auth_user", JSON.stringify(userData));
        }
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
