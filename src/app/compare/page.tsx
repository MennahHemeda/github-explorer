import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareForm } from "@/components/compare/compare-form";
import { CompareResults, CompareResultsSkeleton } from "./compare-results";

export async function generateMetadata(props: PageProps<"/compare">): Promise<Metadata> {
  const { a, b } = parseUsers(await props.searchParams);
  return { title: a && b ? `${a} vs ${b}` : "Compare users" };
}

export default async function ComparePage(props: PageProps<"/compare">) {
  const { a, b } = parseUsers(await props.searchParams);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl">Compare two GitHub users</h1>
        <p className="mt-1 text-zinc-600">
          Repositories, stars, followers, languages and commit frequency, side by side.
        </p>
        <div className="mt-4">
          {/* key: reset the inputs when the URL changes (e.g. Back button) */}
          <CompareForm key={`${a}-${b}`} defaultA={a} defaultB={b} />
        </div>
      </div>

      {a && b ? (
        // The form stays usable while the results stream in.
        <Suspense key={`${a}-${b}`} fallback={<CompareResultsSkeleton />}>
          <CompareResults a={a} b={b} />
        </Suspense>
      ) : (
        <p className="text-sm text-zinc-500">Enter two usernames above to see how they compare.</p>
      )}
    </div>
  );
}

function parseUsers(params: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  return { a: first(params.a), b: first(params.b) };
}
