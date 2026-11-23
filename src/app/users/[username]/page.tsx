import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isValidUsername, loadProfile } from "@/lib/github";
import { ActivityMap, ActivityMapSkeleton } from "@/components/activity-map";
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
    // Desktop: the "character sheet" sits in a sidebar next to the main content. Mobile: one column.
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <aside className="flex flex-col gap-8">
        <ProfileCard user={user} totalStars={totalStars} />
        <Link href={`/compare?a=${user.login}`} className="btn btn-quiet px-4 py-2.5 text-center">
          Compare {user.login} with another user
        </Link>
        <ProfileNotes login={user.login} notes={notesByRepo[""] ?? []} />
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        {/* Streams in on its own, so the rest of the profile shows immediately. */}
        <Suspense fallback={<ActivityMapSkeleton />}>
          <ActivityMap username={user.login} />
        </Suspense>
        <AiSummary username={user.login} />
        <RepoList repos={repos} totalCount={user.public_repos} login={user.login} notesByRepo={notesByRepo} />
      </div>
    </div>
  );
}
