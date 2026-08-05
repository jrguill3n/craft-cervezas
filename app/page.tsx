import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { Intro } from '@/components/home/intro'
import { ClubCraft } from '@/components/home/club-craft'
import { EventsGrid } from '@/components/home/events-grid'

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Intro />
        <ClubCraft />
        <EventsGrid />
      </main>
      <SiteFooter />
    </>
  )
}
