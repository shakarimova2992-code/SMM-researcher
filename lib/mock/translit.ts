const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function translitRaw(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => MAP[ch] ?? ch)
    .join("");
}

export function translit(input: string): string {
  return translitRaw(input)
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 14);
}

export function slugify(input: string): string {
  return translit(input) || "niche";
}

// Транслитерация без обрезки длины, с пробелами вместо разделителей —
// для поиска подстроки в произвольном тексте (био, адрес профиля), а не
// для построения короткого слага.
export function translitLoose(input: string): string {
  return translitRaw(input)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
