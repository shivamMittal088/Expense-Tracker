const rupees = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatRupees = (amount: number, hidden = false): string =>
  hidden ? "₹•••••" : `₹${rupees.format(amount)}`;
