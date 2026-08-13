import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { CurationPillars } from '@/components/home/curation-pillars'
import { branches, contact } from '@/lib/craft-content'
import { siteDescription, siteName, siteUrl } from '@/lib/site'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  email: contact.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Guadalajara',
    addressRegion: 'Jalisco',
    addressCountry: 'MX',
  },
  sameAs: contact.socials.map((social) => social.href),
  subOrganization: branches.map((branch) => ({
    '@type': 'BarOrPub',
    name: `Craft ${branch.name}`,
    url: `${siteUrl}/${branch.slug}`,
    image: `${siteUrl}${branch.image}`,
    address: branch.address,
  })),
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main>
        <Hero />
        <CurationPillars />
      </main>
      <SiteFooter />
    </>
  )
}
