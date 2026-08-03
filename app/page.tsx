import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { BranchSelector } from '@/components/home/branch-selector'
import { ClubCraft } from '@/components/home/club-craft'
import { EventsGrid } from '@/components/home/events-grid'

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <BranchSelector />
        <EventsGrid />
        <ClubCraft />
      </main>
      <SiteFooter />
    </>
  )
}
