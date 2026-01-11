import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Character } from "@/data/characters";
import {
  characters,
  getRarityColor,
  getRarityBorderColor,
} from "@/data/characters";
import { Lock, Zap, Check, Star, Crown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { SonicCharacter } from "@/generated/player_pb";

interface CharacterGalleryProps {
  selectedCharacterId?: string;
  onSelectCharacter: (characterId: string) => void;
  onClose: () => void;
  isSelecting?: boolean;
  unlockedCharacters?: SonicCharacter[];
}

export function CharacterGallery({
  selectedCharacterId,
  onSelectCharacter,
  onClose,
  isSelecting = false,
  unlockedCharacters = [],
}: CharacterGalleryProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  // Merge backend unlocked characters with frontend character data
  const mergedCharacters = useMemo(() => {
    const unlockedIds = new Set(unlockedCharacters.map((c) => c.id));
    return characters.map((char) => ({
      ...char,
      unlocked: unlockedIds.has(char.id),
    }));
  }, [unlockedCharacters]);

  const handleSelectCharacter = (characterId: string) => {
    if (isSelecting) return;
    onSelectCharacter(characterId);
  };

  const filteredCharacters = mergedCharacters.filter((char) => {
    if (filter === "unlocked") return char.unlocked;
    if (filter === "locked") return !char.unlocked;
    return true;
  });

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-7xl bg-white rounded-lg shadow-2xl my-8">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                Character Selection
              </h2>
              <p className="text-muted-foreground mt-1">
                Choose your character to represent you in the game
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All Characters ({mergedCharacters.length})
            </Button>
            <Button
              variant={filter === "unlocked" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unlocked")}
            >
              Unlocked ({mergedCharacters.filter((c) => c.unlocked).length})
            </Button>
            <Button
              variant={filter === "locked" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("locked")}
            >
              Locked ({mergedCharacters.filter((c) => !c.unlocked).length})
            </Button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCharacters.map((character) => (
              <Card
                key={character.id}
                className={`relative cursor-pointer transition-all duration-200 ${
                  selectedCharacterId === character.id
                    ? `ring-2 ring-primary ${getRarityBorderColor(character.rarity)}`
                    : "hover:shadow-lg"
                } ${!character.unlocked ? "opacity-75" : ""} ${getRarityBorderColor(character.rarity)} border-2 ${
                  isSelecting ? "pointer-events-none opacity-50" : ""
                }`}
                onMouseEnter={() => setHoveredCard(character.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() =>
                  character.unlocked && handleSelectCharacter(character.id)
                }
              >
                {/* Rarity Gradient Header */}
                <div
                  className={`h-2 bg-gradient-to-r ${getRarityColor(character.rarity)}`}
                />

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {character.name}
                        {selectedCharacterId === character.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${getRarityColor(character.rarity)} text-white flex items-center gap-1`}
                        >
                          {getRarityIcon(character.rarity)}
                          {character.rarity}
                        </span>
                      </div>
                    </div>
                    {!character.unlocked && (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Character Avatar Placeholder */}
                  <div
                    className={`w-full h-32 rounded-lg ${character.color} flex items-center justify-center text-white text-4xl font-bold shadow-inner`}
                  >
                    {character.name.substring(0, 2).toUpperCase()}
                  </div>

                  <CardDescription className="text-xs line-clamp-2">
                    {character.description}
                  </CardDescription>

                  <Separator />

                  {/* Stats */}
                  {(hoveredCard === character.id ||
                    selectedCharacterId === character.id) && (
                    <div className="space-y-2 animate-fade-in">
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
                  )}

                  {/* Abilities */}
                  {character.unlocked && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Abilities:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {character.abilities.slice(0, 2).map((ability, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                          >
                            {ability.name}
                          </span>
                        ))}
                        {character.abilities.length > 2 && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            +{character.abilities.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quote */}
                  {character.unlocked && (
                    <div className="pt-2 border-t">
                      <p className="text-xs italic text-muted-foreground">
                        "{character.quote}"
                      </p>
                    </div>
                  )}

                  {/* Game Badge */}
                  <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground">
                    <span>{character.game}</span>
                  </div>

                  {/* Locked Overlay */}
                  {!character.unlocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Lock className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-semibold">Locked</p>
                        <p className="text-xs mt-1">
                          Complete challenges to unlock
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCharacters.length === 0 && (
            <div className="text-center py-12">
              <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">
                No characters found
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filter
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-muted/30">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedCharacterId ? (
                <>
                  Selected:{" "}
                  <span className="font-semibold text-foreground">
                    {mergedCharacters.find((c) => c.id === selectedCharacterId)?.name}
                  </span>
                </>
              ) : (
                "No character selected"
              )}
            </div>
            <Button
              onClick={onClose}
              disabled={!selectedCharacterId || isSelecting}
            >
              {isSelecting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                "Confirm Selection"
              )}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
