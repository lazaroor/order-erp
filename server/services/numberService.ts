import { storage } from '../storage';

export async function generateOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = currentYear.toString();
  
  // Get all orders from current year to find the next sequential number
  const allOrders = await storage.getPedidos();
  const currentYearOrders = allOrders.filter(p => p.numero.startsWith(yearPrefix));
  
  let maxSequence = 0;
  for (const order of currentYearOrders) {
    const parts = order.numero.split('-');
    if (parts.length === 2 && parts[0] === yearPrefix) {
      const sequence = parseInt(parts[1]);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  }
  
  const nextSequence = maxSequence + 1;
  return `${yearPrefix}-${nextSequence.toString().padStart(4, '0')}`;
}
