import EndcapShell from "@/components/illustration/EndcapShell";

export default function Home() {
  return (
    <main className="relative flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="flex flex-1 items-center justify-center p-24">
        <h1 className="text-4xl font-bold">mserrano.dev</h1>
      </div>
      <EndcapShell />
    </main>
  );
}
