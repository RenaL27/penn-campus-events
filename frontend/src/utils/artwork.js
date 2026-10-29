// Illustrative stock covers; these do not depict the fictional sample events.
const covers = [
  [/career|resume|writing/i, "career"],
  [/research|science|lab/i, "research"],
  [/picnic|board games/i, "picnic"],
  [/study break social|party|celebration/i, "social"],
  [/club|mixer/i, "clubs"],
  [/organization|workshop/i, "workshop"],
  [/acoustic|music|mic|concert/i, "music"],
  [/photography|camera/i, "photography"],
  [/app|coding|hack/i, "coding"],
  [/gaming|esports/i, "gaming"],
  [/walk|hike|stretch/i, "walking"],
  [/mindful|yoga|meditation/i, "mindfulness"],
  [/culture|conversation|cafe/i, "culture"],
  [/stories|book|discussion/i, "stories"],
  [/service|community/i, "service"],
  [/volunteer/i, "volunteer"],
];

const categoryCovers = {
  "Academic & Career": ["career", "research"],
  "Social & Campus Life": ["picnic", "social"],
  "Clubs & Organizations": ["clubs", "workshop"],
  "Arts & Media": ["music", "photography"],
  "Gaming & Tech": ["coding", "gaming"],
  "Fitness & Wellness": ["walking", "mindfulness"],
  "Cultural & Diversity": ["culture", "stories"],
  "Volunteering & Service": ["service", "volunteer"],
};

export function eventArtwork(event) {
  const title = event.title || "";
  const matched = covers.find(([pattern]) => pattern.test(title));
  if (matched) return `/artwork/events/${matched[1]}.jpg`;
  const choices = categoryCovers[event.category] || [
    "clubs",
    "picnic",
    "social",
  ];
  // A stable choice avoids changing the cover when a list is sorted or filtered.
  const hash = Array.from(String(event._id || title)).reduce(
    (sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return `/artwork/events/${choices[hash % choices.length]}.jpg`;
}
