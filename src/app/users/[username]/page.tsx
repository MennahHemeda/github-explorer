import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllRepos,
  getUser,
  GitHubNotFoundError,
  GitHubRateLimitError,
  isValidUsername,
} from "@/lib/github";
import { ProfileCard } from "@/components/profile-card";
import { RepoList } from "@/components/repo-list";

export async function generateMetadata(props: PageProps<"/users/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: username };
}

export default async function UserPage(props: PageProps<"/users/[username]">) {
  const { username } = await props.params;

  if (!isValidUsername(username)) {
    notFound();
  }

  const result = await loadProfile(username);

  if (result.status === "not-found") {
    notFound();
  }
  if (result.status === "rate-limited") {
    return <RateLimitNotice retryInMinutes={result.retryInMinutes} />;
  }

  const { user, repos } = result;
  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);

  return (
    <div className="flex flex-col gap-8">
      <ProfileCard user={user} totalStars={totalStars} />
      <RepoList repos={repos} />
    </div>
  );
}

/**
 * Loads the profile and all repositories in parallel (two requests at once, not one after another)
 * and turns the expected failures into states the page can render.
 */
async function loadProfile(username: string) {
  try {
    const [user, repos] = await Promise.all([getUser(username), getAllRepos(username)]);
    return { status: "ok", user, repos } as const;
  } catch (error) {
    if (error instanceof GitHubNotFoundError) {
      return { status: "not-found" } as const;
    }
    if (error instanceof GitHubRateLimitError) {
      const retryInMinutes = error.resetAt
        ? Math.max(1, Math.ceil((error.resetAt.getTime() - Date.now()) / 60_000))
        : null;
      return { status: "rate-limited", retryInMinutes } as const;
    }
    throw error; // Unexpected: handled by error.tsx
  }
}

function RateLimitNotice({ retryInMinutes: minutes }: { retryInMinutes: number | null }) {
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <h1 className="text-2xl font-semibold">Too many requests</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        The GitHub API rate limit has been reached.
        {minutes && ` Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`}
      </p>
    </div>
  );
}
