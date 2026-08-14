export const activeOrderKey = "food-order-manager:active-order-id";
const userOrderIdsKey = "food-order-manager:user-order-ids";

export function getSavedOrderIds() {
  const rawValue = window.localStorage.getItem(userOrderIdsKey);
  if (!rawValue) return [];

  try {
    const ids = JSON.parse(rawValue);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveOrderId(orderId: string) {
  const ids = getSavedOrderIds();
  const nextIds = [orderId, ...ids.filter((id) => id !== orderId)];

  window.localStorage.setItem(activeOrderKey, orderId);
  window.localStorage.setItem(userOrderIdsKey, JSON.stringify(nextIds));
}

export function removeSavedOrderId(orderId: string) {
  const nextIds = getSavedOrderIds().filter((id) => id !== orderId);
  window.localStorage.setItem(userOrderIdsKey, JSON.stringify(nextIds));
}
