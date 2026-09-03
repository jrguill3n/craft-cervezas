import type { PosterCategoryPointRateRow } from '@/lib/db-types'

export type PosterCategoryRate = Pick<
  PosterCategoryPointRateRow,
  'poster_category_id' | 'poster_category_name' | 'root_category_id' | 'root_category_name' | 'points_rate' | 'active'
>

export type PosterEligibleLineItem = {
  productId: string | null
  productName: string
  categoryId: string | null
  rootCategoryId: string | null
  rootCategoryName: string | null
  quantity: number
  paidAmount: number
  pointsRate: number
  eligibleAmount: number
  points: number
}

export type PosterPurchasePreview = {
  transactionId: string
  spotId: string | null
  spotName: string | null
  closedAt: string | null
  totalPaid: number
  eligibleAmount: number
  points: number
  eligibleItems: PosterEligibleLineItem[]
  ineligibleItems: PosterEligibleLineItem[]
}

type PosterCategory = {
  category_id?: string | number
  category_name?: string
  parent_category?: string | number | null
}

type PosterProduct = {
  product_id?: string | number
  product_name?: string
  menu_category_id?: string | number
  category_id?: string | number
  num?: string | number
  count?: string | number
  payed_sum?: string | number
  paid_sum?: string | number
  product_sum?: string | number
  sum?: string | number
}

type PosterTransaction = {
  transaction_id?: string | number
  spot_id?: string | number
  date_close?: string | null
  date_close_date?: string | null
  close_date?: string | null
  payed_sum?: string | number
  paid_sum?: string | number
  sum?: string | number
  products?: PosterProduct[] | Record<string, PosterProduct>
}

type PosterSpot = {
  spot_id?: string | number
  name?: string
}

function getPosterToken() {
  const token = process.env.POSTER_ACCESS_TOKEN?.trim()
  if (!token) {
    throw new Error('Poster no está configurado. Falta POSTER_ACCESS_TOKEN.')
  }
  return token
}

async function posterRequest<T>(method: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  const url = new URL(`https://joinposter.com/api/${method}`)
  url.searchParams.set('token', getPosterToken())

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, { cache: 'no-store' })
  const json = await response.json().catch(() => null)

  if (!response.ok || !json || json.error || json.response === false) {
    throw new Error('No se pudo consultar Poster. Revisa el ticket o la integración.')
  }

  return (json.response ?? json) as T
}

function toArray<T>(value: T[] | Record<string, T> | null | undefined) {
  if (!value) return []
  return Array.isArray(value) ? value : Object.values(value)
}

function toStringId(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function toNumber(value: string | number | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function posterMoneyToPesos(value: string | number | null | undefined) {
  const amount = toNumber(value)
  if (!amount) return 0
  return amount / 100
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function getRootCategoryId(categoryId: string | null, categoryById: Map<string, PosterCategory>) {
  if (!categoryId) return null

  let current = categoryById.get(categoryId)
  const seen = new Set<string>()

  while (current) {
    const currentId = toStringId(current.category_id)
    const parentId = toStringId(current.parent_category)

    if (!currentId || !parentId || parentId === '0' || seen.has(currentId)) {
      return currentId
    }

    seen.add(currentId)
    current = categoryById.get(parentId)
  }

  return categoryId
}

function calculateLinePoints(eligibleAmount: number, pointsRate: number) {
  return Math.floor(eligibleAmount * pointsRate)
}

function getProductPaidAmount(product: PosterProduct) {
  return posterMoneyToPesos(product.payed_sum ?? product.paid_sum ?? product.product_sum ?? product.sum)
}

function firstPosterTransaction(value: PosterTransaction | PosterTransaction[] | Record<string, PosterTransaction>) {
  if (Array.isArray(value)) return value[0] ?? null
  if ('transaction_id' in value || 'spot_id' in value || 'products' in value) return value
  return Object.values(value)[0] ?? null
}

export async function getPosterPurchasePreview(
  transactionId: string,
  categoryRates: PosterCategoryRate[],
): Promise<PosterPurchasePreview> {
  const normalizedTransactionId = transactionId.trim()
  if (!normalizedTransactionId) throw new Error('Agrega el ID del ticket Poster.')

  const [transactionRaw, transactionProducts, categories, spots] = await Promise.all([
    posterRequest<PosterTransaction | PosterTransaction[] | Record<string, PosterTransaction>>('dash.getTransaction', {
      transaction_id: normalizedTransactionId,
      include_products: 'true',
      include_history: 'true',
      timezone: 'client',
    }),
    posterRequest<PosterProduct[] | Record<string, PosterProduct>>('dash.getTransactionProducts', {
      transaction_id: normalizedTransactionId,
    }),
    posterRequest<PosterCategory[] | Record<string, PosterCategory>>('menu.getCategories'),
    posterRequest<PosterSpot[] | Record<string, PosterSpot>>('spots.getSpots'),
  ])

  const transaction = firstPosterTransaction(transactionRaw)
  if (!transaction) {
    throw new Error('No encontramos ese ticket en Poster.')
  }

  const transactionProductsList: PosterProduct[] = toArray(transactionProducts)
  const fallbackProducts: PosterProduct[] = toArray(transaction.products)
  const products: PosterProduct[] = transactionProductsList.length > 0 ? transactionProductsList : fallbackProducts
  if (products.length === 0) {
    throw new Error('Poster no devolvió productos para este ticket.')
  }

  const categoryById = new Map(toArray(categories).map((category) => [String(category.category_id), category]))
  const rateByRootId = new Map(
    categoryRates
      .filter((rate) => rate.active && Number(rate.points_rate) > 0)
      .map((rate) => [String(rate.root_category_id), Number(rate.points_rate)]),
  )
  const rootNameById = new Map(
    toArray(categories).map((category) => [String(category.category_id), category.category_name ?? String(category.category_id)]),
  )
  const spotId = toStringId(transaction.spot_id)
  const spot = toArray(spots).find((item) => toStringId(item.spot_id) === spotId)

  const items = products.map((product) => {
    const categoryId = toStringId(product.menu_category_id ?? product.category_id)
    const rootCategoryId = getRootCategoryId(categoryId, categoryById)
    const paidAmount = roundMoney(getProductPaidAmount(product))
    const pointsRate = rootCategoryId ? rateByRootId.get(rootCategoryId) ?? 0 : 0
    const eligibleAmount = pointsRate > 0 ? paidAmount : 0
    const points = calculateLinePoints(eligibleAmount, pointsRate)

    return {
      productId: toStringId(product.product_id),
      productName: product.product_name?.trim() || 'Producto sin nombre',
      categoryId,
      rootCategoryId,
      rootCategoryName: rootCategoryId ? rootNameById.get(rootCategoryId) ?? rootCategoryId : null,
      quantity: toNumber(product.num ?? product.count) || 1,
      paidAmount,
      pointsRate,
      eligibleAmount,
      points,
    }
  })

  const eligibleItems = items.filter((item) => item.pointsRate > 0)
  const ineligibleItems = items.filter((item) => item.pointsRate <= 0)
  const eligibleAmount = roundMoney(eligibleItems.reduce((total, item) => total + item.eligibleAmount, 0))
  const points = eligibleItems.reduce((total, item) => total + item.points, 0)
  const totalPaid = roundMoney(
    posterMoneyToPesos(transaction.payed_sum ?? transaction.paid_sum ?? transaction.sum) ||
      items.reduce((total, item) => total + item.paidAmount, 0),
  )

  return {
    transactionId: toStringId(transaction.transaction_id) ?? normalizedTransactionId,
    spotId,
    spotName: spot?.name ?? null,
    closedAt: transaction.date_close_date ?? transaction.date_close ?? transaction.close_date ?? null,
    totalPaid,
    eligibleAmount,
    points,
    eligibleItems,
    ineligibleItems,
  }
}
