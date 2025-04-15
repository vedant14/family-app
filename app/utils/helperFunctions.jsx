import { htmlToText } from "html-to-text";

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

export function parseCookies(cookieString) {
  if (!cookieString || cookieString === undefined) {
    return null;
  }
  return Object.fromEntries(
    cookieString
      .split("; ")
      .map((cookie) => cookie.split("="))
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

export function getBody(emailData) {
  let body = "";
  if (emailData.payload.body?.data) {
    body = Buffer.from(emailData.payload.body.data, "base64").toString("utf-8");
    return body;
  }

  if (emailData.payload.parts) {
    const textPart = emailData.payload.parts.find(
      (part) => part.mimeType === "text/plain"
    );

    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      return body;
    }

    // Fallback: Try to find HTML part and convert to plain text
    const htmlPart = emailData.payload.parts.find(
      (part) => part.mimeType === "text/html"
    );
    if (htmlPart?.body?.data) {
      const html = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
      body = htmlToText(html, {
        wordwrap: false,
        selectors: [
          { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
        ],
      });
      return body;
    }
  }
  return "";
}

export const formatDate = (dateString) => {
  const date = new Date(dateString);

  const day = date.getDate();
  const suffix = getDaySuffix(day);
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.toLocaleString("default", { year: "numeric" });

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 to 12
  const time = `${hours}:${minutes} ${ampm}`;

  return (
    <div className="flex-column">
      <div className="text-sm text-gray-600">{`${day}${suffix} ${month}, ${year}`}</div>
      <div className="text-xs text-gray-400">{time}</div>
    </div>
  );
};

const getDaySuffix = (day) => {
  if (day > 3 && day < 21) return "th"; // Covers 4-20
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

const cleanRegex = (regex) => {
  return typeof regex === "string"
    ? regex.replace(/^\/|\/$/g, "")
    : regex.toString().replace(/^\/|\/$/g, "");
};

export const extractInfoFromEmail = (
  emailData,
  amount_regex,
  amount_regex_backup,
  payee_regex,
  payee_regex_backup
) => {
  const data = {};
  const cleanedAmountRegex = cleanRegex(amount_regex);
  const cleanedAmountRegexBackup = cleanRegex(amount_regex_backup);
  const cleanedPayeeRegex = cleanRegex(payee_regex);
  const cleanedPayeeRegexBackup = cleanRegex(payee_regex_backup);
  const primaryAmountMatch = emailData.match(new RegExp(cleanedAmountRegex));
  if (primaryAmountMatch) {
    data.amount = primaryAmountMatch[1]
      ? primaryAmountMatch[1]
      : primaryAmountMatch[0];
  } else {
    const backupAmountMatch = emailData.match(
      new RegExp(cleanedAmountRegexBackup)
    );
    data.amount = backupAmountMatch ? backupAmountMatch[0] : null;
  }

  const primaryPayeeMatch = emailData.match(new RegExp(cleanedPayeeRegex));
  if (primaryPayeeMatch) {
    data.payee = primaryPayeeMatch[0];
  } else {
    const backupPayeeMatch = emailData.match(
      new RegExp(cleanedPayeeRegexBackup)
    );
    data.payee = backupPayeeMatch ? backupPayeeMatch[0] : null;
  }
  return data;
};

export const getInitials = (name) => {
  if (name) {
    return name.split("").slice(0, 2).join("").toUpperCase();
  } else {
    return null;
  }
};

export function formatIndianCurrency(value, { roundOff = true } = {}) {
  if (typeof value !== "number") return "0.00";

  const suffixes = [
    { limit: 1e7, divisor: 1e7, suffix: "Cr" },
    { limit: 1e5, divisor: 1e5, suffix: "L" },
    { limit: 1e3, divisor: 1e3, suffix: "k" },
  ];

  if (roundOff) {
    for (const { limit, divisor, suffix } of suffixes) {
      if (value >= limit) {
        return `₹${(value / divisor).toFixed(1)}${suffix}`;
      }
    }
  }

  // Regular Indian format with commas
  return `₹ ${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}`;
}
