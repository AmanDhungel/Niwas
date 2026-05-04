export const getFormattedDate = () => {
  const now = new Date();

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  // Format the parts
  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const parts = formatter.formatToParts(now);

  // Extract parts to build: "HH:MM AM, DD Month YYYY"
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  const dayPeriod = parts
    .find((p) => p.type === "dayPeriod")
    ?.value.toUpperCase();
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;

  return `${hour}:${minute} ${dayPeriod}, ${day} ${month} ${year}`;
};
