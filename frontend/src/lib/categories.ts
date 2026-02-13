import {
  TriviaCategories,
  GuessThatSongCategories,
} from "@/generated/gamemodes_pb";

/**
 * Converts enum keys to human-readable labels
 */
function formatCategoryLabel(enumKey: string): string {
  // Remove the prefix (e.g., "TRIVIA_CATEGORIES_" or "GUESS_THAT_SONG_CATEGORIES_")
  const withoutPrefix = enumKey
    .replace(/^TRIVIA_CATEGORIES_/, "")
    .replace(/^GUESS_THAT_SONG_CATEGORIES_/, "");

  // Skip unspecified values
  if (withoutPrefix.includes("UNSPECIFIED")) {
    return "";
  }

  // Convert SONIC_ADVENTURES_2TRIVIA to "Sonic Adventures 2"
  // Convert SONICHEROES_TRIVIA to "Sonic Heroes"
  return withoutPrefix
    .replace(/_TRIVIA$/, "")
    .replace(/_GUESS_THAT_SONG$/, "")
    .replace(/SONICADVENTURES?_?(\d*)/, (_, num) =>
      num ? `Sonic Adventure ${num}` : "Sonic Adventure",
    )
    .replace(/SONICHEROES/, "Sonic Heroes")
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

/**
 * Get all trivia categories as dropdown options
 */
export function getTriviaCategoryOptions(): Array<{
  value: string;
  label: string;
}> {
  const categories: Array<{ value: string; label: string }> = [];

  for (const [key, value] of Object.entries(TriviaCategories)) {
    // Skip numeric keys (enum reverse mappings) and unspecified
    if (typeof value !== "number" || key.includes("UNSPECIFIED")) {
      continue;
    }

    const label = formatCategoryLabel(key);
    if (label) {
      categories.push({
        value: String(value),
        label,
      });
    }
  }

  return categories;
}

/**
 * Get all song categories as dropdown options
 */
export function getSongCategoryOptions(): Array<{
  value: string;
  label: string;
}> {
  const categories: Array<{ value: string; label: string }> = [];

  for (const [key, value] of Object.entries(GuessThatSongCategories)) {
    // Skip numeric keys (enum reverse mappings) and unspecified
    if (typeof value !== "number" || key.includes("UNSPECIFIED")) {
      continue;
    }

    const label = formatCategoryLabel(key);
    if (label) {
      categories.push({
        value: String(value),
        label,
      });
    }
  }

  return categories;
}

/**
 * Get category label from enum key
 */
export function getCategoryLabel(enumKey: string): string {
  return formatCategoryLabel(enumKey);
}

/**
 * Get all unique categories (combined from both trivia and songs)
 */
/**
 * Get all difficulty options as dropdown options
 */
export function getDifficultyOptions(): Array<{
  value: string;
  label: string;
}> {
  return [
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
  ];
}

export function getAllCategoryOptions(): Array<{
  value: string;
  label: string;
  type: "trivia" | "song" | "both";
}> {
  const triviaCategories = getTriviaCategoryOptions();
  const songCategories = getSongCategoryOptions();

  const categoryMap = new Map<
    string,
    { value: string; label: string; type: "trivia" | "song" | "both" }
  >();

  // Add trivia categories
  triviaCategories.forEach((cat) => {
    categoryMap.set(cat.label, {
      value: cat.value,
      label: cat.label,
      type: "trivia",
    });
  });

  // Add or update with song categories
  songCategories.forEach((cat) => {
    const existing = categoryMap.get(cat.label);
    if (existing) {
      // Category exists in both
      existing.type = "both";
    } else {
      categoryMap.set(cat.label, {
        value: cat.value,
        label: cat.label,
        type: "song",
      });
    }
  });

  return Array.from(categoryMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
