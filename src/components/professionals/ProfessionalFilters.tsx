"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ProfessionalQuery } from "@/types";

// The URL is the single source of truth for the filters, not component state.
// That means a filtered view can be bookmarked, shared, and the back button
// works. Mirroring the URL into useState is how those three things break.
// The options are passed in rather than imported. They come from the API now,
// and this is a Client Component, so it cannot fetch them itself: the page
// fetches once on the server and hands them down.
export default function ProfessionalFilters({
  query,
  specialities,
  locations,
}: {
  query: ProfessionalQuery;
  specialities: readonly string[];
  locations: readonly string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function update(patch: Partial<ProfessionalQuery>) {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      // Drop defaults from the URL so it stays readable.
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    }

    startTransition(() => {
      // scroll: false keeps the page where it is instead of jumping to the top.
      router.push(`/professionals?${next.toString()}`, { scroll: false });
    });
  }

  const selectClasses =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  const filters: {
    id: keyof ProfessionalQuery;
    label: string;
    allLabel: string;
    options: readonly string[];
  }[] = [
    { id: "speciality", label: "Speciality", allLabel: "All specialities", options: specialities },
    { id: "location", label: "Location", allLabel: "All locations", options: locations },
  ];

  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      style={{ opacity: isPending ? 0.6 : 1 }}
    >
      {filters.map((filter) => (
        <div key={filter.id} className="space-y-1.5">
          <label htmlFor={`filter-${filter.id}`} className="text-sm font-medium">
            {filter.label}
          </label>
          <select
            id={`filter-${filter.id}`}
            className={selectClasses}
            value={query[filter.id]}
            onChange={(event) => update({ [filter.id]: event.target.value })}
          >
            <option value="all">{filter.allLabel}</option>
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
