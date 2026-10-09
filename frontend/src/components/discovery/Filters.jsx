import {
  CATEGORIES,
  EVENT_TYPES,
  DATE_PRESETS,
  EMPTY_FILTERS,
} from "../../utils/discovery";
export default function Filters({
  value,
  onChange,
  onApply,
  onReset,
  loggedIn,
}) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const toggle = (key, option) =>
    set(
      key,
      value[key].includes(option)
        ? value[key].filter((x) => x !== option)
        : [...value[key], option],
    );
  return (
    <form
      className="filter-panel"
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div className="filter-heading">
        <h2>Make it your kind of event</h2>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            onChange({ ...EMPTY_FILTERS });
            onReset();
          }}
        >
          Reset all
        </button>
      </div>
      <div className="filter-columns">
        <fieldset>
          <legend>When</legend>
          {Object.entries(DATE_PRESETS).map(([key, label]) => (
            <label className="choice" key={key}>
              <input
                type="radio"
                name="datePreset"
                checked={value.datePreset === key}
                onChange={() =>
                  onChange({
                    ...value,
                    datePreset: key,
                    date: key === "date" ? value.date : "",
                  })
                }
              />
              {label}
            </label>
          ))}
          {value.datePreset === "date" && (
            <input
              aria-label="Event date"
              className="field"
              type="date"
              required
              value={value.date}
              onChange={(e) => set("date", e.target.value)}
            />
          )}
          <p className="field-hint">
            Dates and times are in Philadelphia time.
          </p>
        </fieldset>
        <fieldset>
          <legend>Category</legend>
          {CATEGORIES.map((c) => (
            <label className="choice" key={c}>
              <input
                type="checkbox"
                checked={value.categories.includes(c)}
                onChange={() => toggle("categories", c)}
              />
              {c}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>How & who</legend>
          {EVENT_TYPES.map((t) => (
            <label className="choice" key={t}>
              <input
                type="checkbox"
                checked={value.types.includes(t)}
                onChange={() => toggle("types", t)}
              />
              {t}
            </label>
          ))}
          <label className="choice friends-filter">
            <input
              type="checkbox"
              checked={value.friends}
              disabled={!loggedIn}
              onChange={(e) => set("friends", e.target.checked)}
            />
            Friends are attending
          </label>
          {!loggedIn && (
            <p className="field-hint">Log in to filter by friends.</p>
          )}
          <label className="field-label">
            Sort by
            <select
              className="field"
              value={value.sort}
              onChange={(e) => set("sort", e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="date">Soonest first</option>
              <option value="popularity">Popularity</option>
            </select>
          </label>
        </fieldset>
        <fieldset>
          <legend>A little more specific</legend>
          <label className="field-label">
            Location
            <input
              className="field"
              value={value.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Houston Hall"
            />
          </label>
          <label className="field-label">
            Organizer
            <input
              className="field"
              value={value.organizer}
              onChange={(e) => set("organizer", e.target.value)}
              placeholder="Name"
            />
          </label>
          <label className="field-label">
            Time
            <input
              className="field"
              type="time"
              value={value.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </label>
        </fieldset>
      </div>
      <div className="filter-footer">
        <button className="button" type="submit">
          Apply filters
        </button>
      </div>
    </form>
  );
}
