import { useState, useMemo, useEffect } from "react";
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
  getCharacterImagePath,
} from "@/data/characters";
import { Lock, Zap, Check, Star, Crown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { SonicCharacter } from "@/generated/player_pb";
import { CharacterDetailModal } from "@/components/CharacterDetailModal";

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
  const [typeFilter, setTypeFilter] = useState<
    "all" | "hero" | "villain" | "neutral"
  >("all");
  const [expandedCharacter, setExpandedCharacter] = useState<Character | null>(
    null,
  );

  // Lock body scroll when component mounts, unlock when it unmounts
  useEffect(() => {
    // Store original overflow style
    const originalOverflow = document.body.style.overflow;

    // Lock scroll
    document.body.style.overflow = "hidden";

    // Cleanup function to restore scroll
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
    setExpandedCharacter(null);
  };

  const handleCharacterClick = (character: Character) => {
    if (!character.unlocked) return;
    setExpandedCharacter(character);
  };

  const filteredCharacters = mergedCharacters.filter((char) => {
    // Apply unlock status filter
    const matchesUnlockFilter =
      filter === "all" ||
      (filter === "unlocked" && char.unlocked) ||
      (filter === "locked" && !char.unlocked);

    // Apply type filter
    const matchesTypeFilter = typeFilter === "all" || char.type === typeFilter;

    return matchesUnlockFilter && matchesTypeFilter;
  });

  // Calculate counts for filter buttons based on current selections
  const getFilterCounts = () => {
    const allChars = mergedCharacters.filter(
      (char) => typeFilter === "all" || char.type === typeFilter,
    );
    const unlockedChars = allChars.filter((char) => char.unlocked);
    const lockedChars = allChars.filter((char) => !char.unlocked);

    const typeChars = mergedCharacters.filter(
      (char) =>
        filter === "all" ||
        (filter === "unlocked" && char.unlocked) ||
        (filter === "locked" && !char.unlocked),
    );
    const heroChars = typeChars.filter((char) => char.type === "hero");
    const villainChars = typeChars.filter((char) => char.type === "villain");
    const neutralChars = typeChars.filter((char) => char.type === "neutral");

    return {
      all: allChars.length,
      unlocked: unlockedChars.length,
      locked: lockedChars.length,
      allTypes: typeChars.length,
      heroes: heroChars.length,
      villains: villainChars.length,
      neutral: neutralChars.length,
    };
  };

  const counts = getFilterCounts();

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-7xl bg-white rounded-lg shadow-2xl my-8 max-h-[90vh] flex flex-col">
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
          <div className="space-y-3 mt-4">
            {/* Unlock Status Filters */}
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All Characters ({counts.all})
              </Button>
              <Button
                variant={filter === "unlocked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unlocked")}
              >
                Unlocked ({counts.unlocked})
              </Button>
              <Button
                variant={filter === "locked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("locked")}
              >
                Locked ({counts.locked})
              </Button>
            </div>

            {/* Character Type Filters */}
            <div className="flex gap-2">
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("all")}
              >
                All Types ({counts.allTypes})
              </Button>
              <Button
                variant={typeFilter === "hero" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("hero")}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
              >
                Heroes ({counts.heroes})
              </Button>
              <Button
                variant={typeFilter === "villain" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("villain")}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 data-[state=on]:bg-red-600 data-[state=on]:text-white"
              >
                Villains ({counts.villains})
              </Button>
              <Button
                variant={typeFilter === "neutral" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("neutral")}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 data-[state=on]:bg-gray-600 data-[state=on]:text-white"
              >
                Neutral ({counts.neutral})
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
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
                onClick={() => handleCharacterClick(character)}
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
                  {/* Character Avatar */}
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                    <img
                      src={getCharacterImagePath(character)}
                      alt={character.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector(".fallback-text")) {
                          const fallback = document.createElement("div");
                          fallback.className = `fallback-text w-full h-full ${character.color} flex items-center justify-center text-white text-4xl font-bold rounded-lg`;
                          fallback.textContent = character.name
                            .substring(0, 2)
                            .toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
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
                    {
                      mergedCharacters.find((c) => c.id === selectedCharacterId)
                        ?.name
                    }
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

      <CharacterDetailModal
        character={expandedCharacter}
        isOpen={!!expandedCharacter}
        onClose={() => setExpandedCharacter(null)}
        onSelectCharacter={handleSelectCharacter}
        selectedCharacterId={selectedCharacterId}
        isSelecting={isSelecting}
      />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .scrollbar-hide {
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-scrollbar: none;
          /* Hide scrollbar for IE, Edge and Firefox */
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
