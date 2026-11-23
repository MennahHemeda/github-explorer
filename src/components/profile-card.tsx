import Image from "next/image";
import type { GitHubUser } from "@/lib/github";
import { formatCount, formatDate } from "@/lib/format";

interface ProfileCardProps {
  user: GitHubUser;
  totalStars: number;
}

export function ProfileCard({ user, totalStars }: ProfileCardProps) {
  const stats = [
    { label: "Repositories", value: user.public_repos },
    { label: "Followers", value: user.followers },
    { label: "Following", value: user.following },
    { label: "Total stars", value: totalStars },
  ];

  const details = [
    user.company && { label: "Company", value: user.company },
    user.location && { label: "Location", value: user.location },
    user.blog && { label: "Website", value: user.blog, href: toUrl(user.blog) },
    user.twitter_username && {
      label: "X / Twitter",
      value: `@${user.twitter_username}`,
      href: `https://x.com/${user.twitter_username}`,
    },
    { label: "Joined", value: formatDate(user.created_at) },
  ].filter((item): item is DetailItem => Boolean(item));

  return (
    <section className="window p-6" data-tone="sky">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start lg:flex-col">
        <Image
          src={user.avatar_url}
          alt={`${user.login}'s avatar`}
          width={112}
          height={112}
          priority
          className="pixel-frame h-28 w-28"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl">{user.name ?? user.login}</h1>
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:underline"
          >
            @{user.login}
          </a>
          {user.bio && <p className="mt-3 text-zinc-700">{user.bio}</p>}

          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-1">
            {details.map((item) => (
              <div key={item.label} className="flex gap-2">
                <dt className="text-zinc-500">{item.label}:</dt>
                <dd className="truncate">
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col-reverse bg-zinc-50 p-3 text-center"
          >
            <dt className="text-xs text-zinc-500">{stat.label}</dt>
            <dd className="font-game text-2xl">{formatCount(stat.value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

interface DetailItem {
  label: string;
  value: string;
  href?: string;
}

/** GitHub stores websites with or without a protocol ("example.com"). */
function toUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
