export const startOfWeekUTC = (d = new Date()) => {
  const date = new Date(d.toISOString()); // Ensure we're working with a UTC date
  const day = date.getUTCDay(); // 0 (Sun) to 6 (Sat) in UTC
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // Assuming Monday start in UTC
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff, 0, 0, 0, 0)
  );
};

export const endOfWeekUTC = (d = new Date()) => {
  const start = startOfWeekUTC(d);
  return new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() + 6,
      23,
      59,
      59,
      999
    )
  );
};

export const startOfMonthUTC = (d = new Date()) => {
  const date = new Date(d.toISOString());
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)
  );
};

export const endOfMonthUTC = (d = new Date()) => {
  const date = new Date(d.toISOString());
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
};

export const subWeeksUTC = (d = new Date(), w = 1) => {
  const date = new Date(d.toISOString());
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - w * 7,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
};

export const subMonthsUTC = (d = new Date(), m = 1) => {
  const date = new Date(d.toISOString());
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() - m,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
};
