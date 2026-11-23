import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidUsername, loadProfile } from "@/lib/github";
import { AiSummary } from "@/components/ai-summary";
import { ProfileNotes } from "@/components/notes/profile-notes";
import { ProfileCard } from "@/components/profile-card";
import { RateLimitNotice, UnreachableNotice } from "@/components/rate-limit-notice";
import { RepoList } from "@/components/repo-list";
import { getNotesForProfile, groupByRepo } from "@/lib/notes/queries";

export async function generateMetadata(props: PageProps<"/users/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: username };
}

export default async function UserPage(props: PageProps<"/users/[username]">) {
  const { username } = await props.params;

  if (!isValidUsername(username)) {
    notFound();
  }

  // GitHub data and the visitor's notes load in parallel.
  const [result, notes] = await Promise.all([loadProfile(username), getNotesForProfile(username)]);

  if (result.status === "not-found") {
    notFound();
  }
  if (result.status === "rate-limited") {
    return <RateLimitNotice retryInMinutes={result.retryInMinutes} />;
  }
  if (result.status === "unreachable") {
    return <UnreachableNotice />;
  }

  const { user, repos } = result;
  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const notesByRepo = groupByRepo(notes);

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
      <AiSummary username={user.login} />
      <ProfileNotes login={user.login} notes={notesByRepo[""] ?? []} />
      <RepoList repos={repos} login={user.login} notesByRepo={notesByRepo} />
    </div>
  );
}
