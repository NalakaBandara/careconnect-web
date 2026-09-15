"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/Input";
import Button from "@/components/Button";

// A real <form> with method GET would also work, but pushing through the router
// keeps the existing filters in the URL instead of wiping them.
export default function ProfessionalSearchBar({ defaultTerm }: { defaultTerm: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = new FormData(event.currentTarget).get("term");
    const next = new URLSearchParams(searchParams.toString());

    if (typeof term === "string" && term.trim()) next.set("term", term.trim());
    else next.delete("term");

    router.push(`/professionals?${next.toString()}`, { scroll: false });
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Search healthcare professionals"
      className="grid gap-4 rounded-lg border border-border bg-background p-5 shadow-raised sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <div className="space-y-1.5">
        <label htmlFor="search-term" className="text-sm font-medium">
          Professional name or speciality
        </label>
        <Input
          id="search-term"
          name="term"
          defaultValue={defaultTerm}
          placeholder="e.g. dentist, physiotherapy, Dr Mehta"
          className="h-11"
        />
      </div>
      <Button type="submit" size="lg">
        Search
      </Button>
    </form>
  );
}
