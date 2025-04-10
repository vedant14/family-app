const now = new Date();

export const startOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // assuming Monday start
  return new Date(date.setDate(diff));
};

export const endOfWeek = (d = new Date()) => {
  const start = startOfWeek(d);
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59,
    999
  );
};

export const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

export const subWeeks = (d = new Date(), w = 1) =>
  new Date(d.getTime() - w * 7 * 24 * 60 * 60 * 1000);

export const subMonths = (d = new Date(), m = 1) =>
  new Date(d.getFullYear(), d.getMonth() - m, d.getDate());
