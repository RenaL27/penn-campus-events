// Illustrative covers extracted from the user's final case-study prototypes.
// These are category fallbacks, not photos of the individual listed events.
export function eventArtwork(event) {
  const text = `${event.title || ""} ${event.category || ""}`.toLowerCase();
  if (/coffee|network/.test(text)) return "/artwork/coffee.jpg";
  if (/hack|tech|gaming/.test(text)) return "/artwork/tech.jpg";
  if (/academic|research|symposium|lecture/.test(text))
    return "/artwork/academic.jpg";
  return "/artwork/campus.jpg";
}
