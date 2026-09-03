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

export type BeerLocationRow = {
  beer_id: string
  location_id: string
  created_at: string
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

export type PromotionRow = {
  id: string
  title: string
  image_url: string
  instagram_url: string
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type ClubMemberRow = {
  id: string
  member_code: string
  first_name: string
  last_name: string | null
  phone: string
  email: string | null
  birth_date: string | null
  points_balance: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  last_activity_at: string | null
}

export type ClubMemberPublicRow = Pick<ClubMemberRow, 'member_code' | 'first_name' | 'points_balance' | 'status'>

export type ClubMemberScannerRow = Pick<ClubMemberRow, 'id' | 'member_code' | 'first_name' | 'last_name' | 'points_balance' | 'status'>

export type PointsTransactionRow = {
  id: string
  member_id: string
  transaction_type: 'earn' | 'redeem' | 'adjustment' | 'expiration'
  points: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  reason: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
}

export type RewardRow = {
  id: string
  name: string
  description: string | null
  points_cost: number
  image_url: string | null
  active: boolean
  stock_optional: number | null
  created_at: string
  updated_at: string
}

export type RedemptionRow = {
  id: string
  member_id: string
  reward_id: string
  points_spent: number
  redeemed_by: string | null
  points_transaction_id: string
  created_at: string
}

export type PosterCategoryPointRateRow = {
  id: string
  poster_category_id: string
  poster_category_name: string
  parent_category_id: string | null
  root_category_id: string
  root_category_name: string
  points_rate: number
  active: boolean
  created_at: string
  updated_at: string
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

export type PointsTransactionWithMember = PointsTransactionRow & {
  club_members: Pick<ClubMemberRow, 'id' | 'member_code' | 'first_name' | 'last_name' | 'phone'> | null
  created_by_profile?: Pick<ProfileRow, 'id' | 'full_name'> | null
}
