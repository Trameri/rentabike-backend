export function computeItemPrice(startAt, endAt, priceHourly, priceDaily){
  const ms = new Date(endAt) - new Date(startAt);
  const hours = Math.ceil(ms / (1000*60*60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  let total = 0;
  if(days > 0){
    total += days * priceDaily;
    total += Math.min(remHours * priceHourly, priceDaily);
  } else {
    total += Math.min(hours * priceHourly, priceDaily);
  }
  return { hours, total };
}
