import Button from "@/components/Button";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-5xl">CareConnect</h1>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </div>
    </main>
  );
}
