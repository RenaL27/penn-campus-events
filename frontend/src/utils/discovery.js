export const CATEGORIES = [
  "Academic & Career",
  "Social & Campus Life",
  "Clubs & Organizations",
  "Arts & Media",
  "Gaming & Tech",
  "Fitness & Wellness",
  "Cultural & Diversity",
  "Volunteering & Service",
];
export const EVENT_TYPES = ["In-Person", "Online", "Hybrid"];
export const DATE_PRESETS = {
  any: "Any date",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  weekend: "This weekend",
  date: "Choose a date",
};
export const EMPTY_FILTERS = {
  categories: [],
  types: [],
  datePreset: "any",
  date: "",
  friends: false,
  sort: "relevance",
  location: "",
  organizer: "",
  time: "",
};
export function readFilters(params) {
  return {
    ...EMPTY_FILTERS,
    categories: (params.get("categories") || "")
      .split(",")
      .filter((x) => CATEGORIES.includes(x)),
    types: (params.get("types") || "")
      .split(",")
      .filter((x) => EVENT_TYPES.includes(x)),
    datePreset: DATE_PRESETS[params.get("datePreset")]
      ? params.get("datePreset")
      : "any",
    date: params.get("date") || "",
    friends: params.get("friends") === "true",
    sort: ["date", "popularity", "relevance"].includes(params.get("sort"))
      ? params.get("sort")
      : "relevance",
    location: params.get("location") || "",
    organizer: params.get("organizer") || "",
    time: params.get("time") || "",
  };
}
export function searchParams(q, filters, page = 1) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else if (value && value !== "any" && value !== "relevance")
      params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  return params;
}
