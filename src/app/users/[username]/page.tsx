import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidUsername, loadProfile } from "@/lib/github";
import { ProfileCard } from "@/components/profile-card";
import { RateLimitNotice } from "@/components/rate-limit-notice";
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
      <div className="-mt-4 flex justify-end">
        <Link
          href={`/compare?a=${user.login}`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Compare {user.login} with another user →
        </Link>
      </div>
      <RepoList repos={repos} />
    </div>
  );
}
