const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const toDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getDayRange = (dateString, timezoneOffset = 0) => {
  const normalizedDateString = dateString || toDateString();

  if (!DATE_PATTERN.test(normalizedDateString)) {
    throw new Error("Date must use YYYY-MM-DD format.");
  }

  const normalizedTimezoneOffset = Number(timezoneOffset);

  if (!Number.isFinite(normalizedTimezoneOffset)) {
    throw new Error("Timezone offset must be a number.");
  }

  const [year, month, day] = normalizedDateString.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day) + normalizedTimezoneOffset * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    date: normalizedDateString,
    start,
    end,
  };
};

export const parseSpentAt = (spentAt) => {
  if (!spentAt) {
    return new Date();
  }

  const date = new Date(spentAt);

  if (Number.isNaN(date.getTime())) {
    throw new Error("spentAt must be a valid date.");
  }

  return date;
};

export const toCents = (amount) => {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  return Math.round(amount * 100);
};
