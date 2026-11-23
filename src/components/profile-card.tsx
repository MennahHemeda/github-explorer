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
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Image
          src={user.avatar_url}
          alt={`${user.login}'s avatar`}
          width={112}
          height={112}
          priority
          className="h-28 w-28 rounded-full border border-zinc-200 dark:border-zinc-700"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{user.name ?? user.login}</h1>
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:underline"
          >
            @{user.login}
          </a>
          {user.bio && <p className="mt-3 text-zinc-700 dark:text-zinc-300">{user.bio}</p>}

          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
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

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col-reverse rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800/60"
          >
            <dt className="text-xs text-zinc-500">{stat.label}</dt>
            <dd className="text-xl font-semibold">{formatCount(stat.value)}</dd>
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
