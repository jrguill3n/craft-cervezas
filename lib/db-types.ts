/** Normalised types matching the Craft Cervezas schema. */

export type LocationRow = {
  id: string
  name: string
  slug: string
  active: boolean
  created_at: string
  updated_at: string
}

export type ProfileRow = {
  id: string
  full_name: string | null
  role: 'super_admin' | 'location_manager'
  active: boolean
}

export type BeerRow = {
  id: string
  name: string
  brewery: string
  style: string
  abv: number
  primary_price?: number | null
  description: string | null
  created_at: string
  updated_at: string
}

export type TapListRow = {
  id: string
  location_id: string
  status: 'draft' | 'published'
  published_at: string | null
  published_by: string | null
  created_at: string
  updated_at: string
}

export type TapListItemRow = {
  id: string
  tap_list_id: string
  beer_id: string
  tap_number: number | null
  badge: 'new' | 'limited' | 'guest' | 'house' | null
  display_order: number
  created_at: string
  updated_at: string
}

export type ServingOptionRow = {
  id: string
  beer_id: string
  label: string
  size: string
  price: number
  display_order: number
}

// Joined shapes used in the UI
export type TapListItemFull = TapListItemRow & {
  beers: BeerRow
  serving_options: ServingOptionRow[]
}

export type TapListFull = TapListRow & {
  locations: LocationRow
  tap_list_items: TapListItemFull[]
}
