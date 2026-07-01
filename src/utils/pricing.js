export function computeItemPrice(startAt, endAt, priceHourly, priceDaily){
  const ms = new Date(endAt) - new Date(startAt);
  const minutes = Math.ceil(ms / (1000*60));
  const hours = Math.ceil(minutes / 60);
  const itemPrice = Math.min(hours * priceHourly, priceDaily);
  return { hours, total: Math.round(itemPrice * 100) / 100 };
}
