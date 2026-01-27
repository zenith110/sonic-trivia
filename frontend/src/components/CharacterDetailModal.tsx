import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Character } from "@/data/characters";
import { getRarityColor, getCharacterImagePath } from "@/data/characters";
import { Lock, Zap, Check, Star, Crown, X, Info } from "lucide-react";

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter: (characterId: string) => void;
  selectedCharacterId?: string;
  isSelecting?: boolean;
}

export function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onSelectCharacter,
  selectedCharacterId,
  isSelecting = false,
}: CharacterDetailModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow style
      const originalOverflow = document.body.style.overflow;

      // Lock scroll
      document.body.style.overflow = "hidden";

      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !character) return null;

  const getRarityIcon = (rarity: Character["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return <Crown className="h-4 w-4" />;
      case "epic":
        return <Star className="h-4 w-4" />;
      case "rare":
        return <Zap className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const StatBar = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  const handleSelectCharacter = () => {
    onSelectCharacter(character.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header with gradient */}
        <div
          className={`h-4 bg-gradient-to-r ${getRarityColor(character.rarity)} flex-shrink-0`}
        />

        {/* Scrollable content area */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-bold">{character.name}</h3>
                <span
                  className={`text-sm font-semibold uppercase px-3 py-1 rounded-full bg-gradient-to-r ${getRarityColor(character.rarity)} text-white flex items-center gap-1`}
                >
                  {getRarityIcon(character.rarity)}
                  {character.rarity}
                </span>
                <span
                  className={`text-sm font-semibold uppercase px-3 py-1 rounded-full ${
                    character.type === "hero"
                      ? "bg-blue-100 text-blue-700"
                      : character.type === "villain"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {character.type}
                </span>
              </div>
              <p className="text-muted-foreground text-lg">
                {character.description}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                From: {character.game}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Character Image */}
            <div className="space-y-4">
              <div className="w-full h-80 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src={getCharacterImagePath(character)}
                  alt={character.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector(".fallback-text")) {
                      const fallback = document.createElement("div");
                      fallback.className = `fallback-text w-full h-full ${character.color} flex items-center justify-center text-white text-6xl font-bold rounded-lg`;
                      fallback.textContent = character.name
                        .substring(0, 2)
                        .toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>

              {/* Quote */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-lg italic text-center">
                  "{character.quote}"
                </p>
              </div>
            </div>

            {/* Character Details */}
            <div className="space-y-6">
              {/* Stats */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Stats
                </h4>
                <div className="space-y-3">
                  <StatBar
                    label="Speed"
                    value={character.speed}
                    color="bg-blue-500"
                  />
                  <StatBar
                    label="Power"
                    value={character.power}
                    color="bg-red-500"
                  />
                  <StatBar
                    label="Technique"
                    value={character.technique}
                    color="bg-green-500"
                  />
                </div>
              </div>

              <Separator />

              {/* Abilities */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Abilities
                </h4>
                <div className="space-y-3">
                  {character.abilities.map((ability, idx) => (
                    <div key={idx} className="bg-primary/5 p-3 rounded-lg">
                      <h5 className="font-semibold text-primary">
                        {ability.name}
                      </h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ability.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Character Type & Game Info */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-semibold capitalize">
                    {character.type}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-muted-foreground">Game:</span>
                  <span className="font-semibold">{character.game}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 p-6 border-t bg-white">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedCharacterId === character.id ? (
                <span className="flex items-center gap-2 text-primary font-semibold">
                  <Check className="h-4 w-4" />
                  Currently Selected
                </span>
              ) : !character.unlocked ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Character Locked
                </span>
              ) : null}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {character.unlocked && selectedCharacterId !== character.id && (
                <Button
                  onClick={handleSelectCharacter}
                  disabled={isSelecting}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  {isSelecting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Selecting...
                    </span>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Select Character
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
