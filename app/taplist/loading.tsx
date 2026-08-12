export default function TapListsLoading() {
  return (
    <main className="mx-auto max-w-[1600px] animate-pulse px-5 py-12 md:px-10 md:py-20">
      <div className="h-3 w-24 bg-foreground/10" />
      <div className="mt-5 h-20 max-w-xl bg-foreground/10" />
      <div className="mt-8 h-5 max-w-lg bg-foreground/10" />
      <div className="mt-16 h-14 border-y border-foreground/10" />
      <div className="mt-12 space-y-4">
        <div className="h-20 bg-foreground/5" />
        <div className="h-20 bg-foreground/5" />
        <div className="h-20 bg-foreground/5" />
      </div>
    </main>
  )
}
