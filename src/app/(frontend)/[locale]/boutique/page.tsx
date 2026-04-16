import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/server'
import type { Locale } from '@/i18n/config'
import { Breadcrumb } from '@/components/shared/Breadcrumb'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.products.catalog.title,
    description: dict.products.catalog.subtitle,
  }
}

function ProductSkeleton() {
  return (
    <Card className="hover:translate-y-0">
      <div className="aspect-square bg-card animate-pulse" />
      <div className="p-md space-y-xs">
        <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/2" />
        <div className="h-5 bg-neutral-100 rounded animate-pulse w-1/3 mt-sm" />
      </div>
    </Card>
  )
}

export default async function BoutiquePage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const filterCategories = dict.products.catalog.filterCategories as Record<string, string>
  const pagination = dict.products.catalog.pagination as Record<string, string>

  return (
    <>
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-lg">
          <Breadcrumb
            items={[
              { label: dict.nav.home, href: `/${locale}` },
              { label: dict.products.catalog.title },
            ]}
          />
        </div>
      </section>

      <section className="py-4xl">
        <div className="max-w-7xl mx-auto px-lg">
          <div className="text-center mb-2xl">
            <h1 className="font-heading text-display text-neutral-600 mb-xs">
              {dict.products.catalog.title}
            </h1>
            <p className="font-body text-body-lg text-neutral-400 max-w-2xl mx-auto">
              {dict.products.catalog.subtitle}
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-sm mb-2xl">
            {Object.entries(filterCategories).map(([key, label], index) => (
              <button
                key={String(key)}
                className={`
                  px-lg py-sm rounded-full font-ui text-body-sm font-medium
                  transition-all duration-200
                  ${
                    index === 0
                      ? 'bg-brand text-white'
                      : 'bg-white text-neutral-400 border border-neutral-200 hover:border-brand hover:text-brand'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-sm mt-2xl">
            <Button variant="ghost" size="sm" disabled>
              {pagination.previous}
            </Button>
            <div className="flex items-center gap-xs">
              <button className="w-10 h-10 rounded-lg bg-brand text-white font-ui text-body-sm font-medium">
                1
              </button>
              <button className="w-10 h-10 rounded-lg bg-white text-neutral-400 font-ui text-body-sm font-medium border border-neutral-200 hover:border-brand hover:text-brand transition-colors duration-200">
                2
              </button>
              <button className="w-10 h-10 rounded-lg bg-white text-neutral-400 font-ui text-body-sm font-medium border border-neutral-200 hover:border-brand hover:text-brand transition-colors duration-200">
                3
              </button>
            </div>
            <Button variant="ghost" size="sm">
              {pagination.next}
            </Button>
          </div>
        </div>
      </section>

      <div className="h-14 lg:hidden" />
    </>
  )
}
