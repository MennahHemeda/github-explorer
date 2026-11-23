// Colors for the most common languages (same as GitHub's). Others fall back to gray.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  "Jupyter Notebook": "#DA5B0B",
};

export function LanguageDot({ language }: { language: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: LANGUAGE_COLORS[language] ?? "#a1a1aa" }}
      />
      {language}
    </span>
  );
}
