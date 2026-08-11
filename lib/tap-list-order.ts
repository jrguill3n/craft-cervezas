type TapListOrderable = {
  tap_number: number | null
  display_order: number
}

export function compareTapListItems(a: TapListOrderable, b: TapListOrderable) {
  const tapA = a.tap_number ?? Number.MAX_SAFE_INTEGER
  const tapB = b.tap_number ?? Number.MAX_SAFE_INTEGER

  return tapA - tapB || a.display_order - b.display_order
}
