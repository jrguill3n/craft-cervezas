import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export default function TapListsLoading() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-[1600px] animate-pulse px-5 py-12 md:px-10 md:py-20">
          <div className="h-3 w-24 bg-foreground/10" />
          <div className="mt-5 h-20 max-w-xl bg-foreground/10" />
          <div className="mt-8 h-5 max-w-lg bg-foreground/10" />
        </section>
        <section className="animate-pulse">
          <div className="border-y border-foreground/20">
            <div className="mx-auto flex max-w-[1600px] gap-4 px-5 md:px-10">
              <div className="my-4 h-6 w-24 bg-foreground/10" />
              <div className="my-4 h-6 w-24 bg-foreground/10" />
              <div className="my-4 h-6 w-28 bg-foreground/10" />
            </div>
          </div>
          <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-16">
            <div className="flex items-end justify-between border-b border-foreground/25 pb-5">
              <div>
                <div className="h-3 w-20 bg-foreground/10" />
                <div className="mt-3 h-12 w-52 bg-foreground/10" />
              </div>
              <div className="h-10 w-32 bg-foreground/10" />
            </div>
            <div className="mt-5 space-y-4">
              <div className="h-20 bg-foreground/5" />
              <div className="h-20 bg-foreground/5" />
              <div className="h-20 bg-foreground/5" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
