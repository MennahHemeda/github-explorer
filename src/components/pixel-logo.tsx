/** A small pixel-art magnifying glass, drawn on a 10×10 grid. */
const PIXELS = [
  "..####....",
  ".#....#...",
  "#..##..#..",
  "#.#....#..",
  "#......#..",
  ".#....#...",
  "..####.#..",
  ".......##.",
  "........##",
  ".........#",
];

export function PixelLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden shapeRendering="crispEdges">
      {PIXELS.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="currentColor" /> : null,
        ),
      )}
    </svg>
  );
}
