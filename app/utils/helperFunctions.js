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
  } else if (emailData.payload.parts) {
    const textPart = emailData.payload.parts.find(
      (part) => part.mimeType === "text/plain"
    );
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    } else {
      const htmlPart = emailData.payload.parts.find(
        (part) => part.mimeType === "text/html"
      );
      if (htmlPart?.body?.data) {
        body = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
      }
    }
  }
  return body;
}

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.toLocaleString("default", { year: "numeric" });

  return `${day}${suffix} ${month}, ${year}`;
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
