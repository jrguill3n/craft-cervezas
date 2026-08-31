export const CLUB_CRAFT_EARN_RATE = 0.05

export function calculateClubCraftEarnPoints(eligiblePurchaseAmount: number) {
  if (!Number.isFinite(eligiblePurchaseAmount) || eligiblePurchaseAmount <= 0) {
    return 0
  }

  return Math.floor(eligiblePurchaseAmount * CLUB_CRAFT_EARN_RATE)
}
