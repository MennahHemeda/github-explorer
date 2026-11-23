import Link from "next/link";

const FEATURES = [
  {
    icon: "🔍",
    tone: "bg-sky",
    title: "Explore a profile",
    text: "Stats, bio and every public repository, with search, filters and sorting.",
  },
  {
    icon: "⚔️",
    tone: "bg-mint",
    title: "Compare two profiles",
    text: "Repositories, stars, followers and commit activity side by side.",
    href: "/compare",
    action: "Compare profiles",
  },
  {
    icon: "✨",
    tone: "bg-lilac",
    title: "Ask the AI",
    text: "A short read on a developer's skills, best projects and activity.",
  },
  {
    icon: "📝",
    tone: "bg-peach",
    title: "Keep notes",
    text: "Private notes on any user or repository, saved for your next visit.",
    href: "/notes",
    action: "Open my notes",
  },
];

/** What the app can do, shown next to the search on wide screens. */
export function FeatureBoard() {
  return (
    <section aria-labelledby="features-heading" className="window p-6 sm:p-8">
      <h2 id="features-heading" className="text-2xl">
        What you can do
      </h2>
      {/* Equal-height rows, so the icons are evenly spaced however long each description is. */}
      <ul className="mt-4 grid auto-rows-fr gap-5">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-4">
            <span aria-hidden className={`pixel-frame grid h-11 w-11 shrink-0 place-items-center text-xl ${feature.tone}`}>
              {feature.icon}
            </span>
            <div>
              <h3 className="text-lg">{feature.title}</h3>
              <p className="text-sm text-zinc-600">{feature.text}</p>
              {feature.href && (
                <Link href={feature.href} className="mt-1 inline-block font-game text-sm font-medium underline decoration-2 underline-offset-2 hover:bg-peach">
                  {feature.action}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
