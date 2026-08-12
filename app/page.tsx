import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { Intro } from '@/components/home/intro'

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Intro />
      </main>
      <SiteFooter />
    </>
  )
}
