const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds

export const startOfWeek = (d = new Date()) => {
  const date = new Date(d.getTime() + IST_OFFSET); // Convert to IST
  const day = date.getDay(); // 0 (Sun) to 6 (Sat) in IST
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Assuming Monday start in IST
  const istStartDate = new Date(date.setDate(diff));
  return new Date(istStartDate.getTime() - IST_OFFSET); // Convert back to local Date object (representing IST)
};

export const endOfWeek = (d = new Date()) => {
  const start = startOfWeek(d);
  const istEndDate = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59,
    999
  );
  return new Date(istEndDate.getTime() - IST_OFFSET); // Convert back to local Date object (representing IST)
};

export const startOfMonth = (d = new Date()) => {
  const date = new Date(d.getTime() + IST_OFFSET); // Convert to IST
  const istStartOfMonth = new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
  return new Date(istStartOfMonth.getTime() - IST_OFFSET); // Convert back
};

export const endOfMonth = (d = new Date()) => {
  const date = new Date(d.getTime() + IST_OFFSET); // Convert to IST
  const istEndOfMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return new Date(istEndOfMonth.getTime() - IST_OFFSET); // Convert back
};

export const subWeeks = (d = new Date(), w = 1) => {
  return new Date(d.getTime() - w * 7 * 24 * 60 * 60 * 1000); // Time difference is consistent across timezones
};

export const subMonths = (d = new Date(), m = 1) => {
  const date = new Date(d.getTime() + IST_OFFSET); // Convert to IST
  const istSubMonth = new Date(
    date.getFullYear(),
    date.getMonth() - m,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
  return new Date(istSubMonth.getTime() - IST_OFFSET); // Convert back
};
