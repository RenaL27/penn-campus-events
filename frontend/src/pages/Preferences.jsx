import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import { CATEGORIES } from "../utils/discovery";
import Layout from "../components/discovery/Layout";
import Icon from "../components/discovery/Icon";
import { ErrorMessage, Loading } from "../components/discovery/Feedback";
export default function Preferences() {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    api("/users/me")
      .then((u) => setInterests(u.interests))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await api("/users/me/interests", "PUT", { interests });
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Layout>
      <div className="page-intro">
        <p className="eyebrow">EVENT PREFERENCES</p>
        <h1>Your interests</h1>
        <p>
          Select topics for your event recommendations. You can update these at
          any time.
        </p>
      </div>
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : (
        <form className="preferences-form" onSubmit={save}>
          <div className="interest-grid">
            {CATEGORIES.map((category, i) => (
              <label
                key={category}
                className={`interest-option ${interests.includes(category) ? "chosen" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={interests.includes(category)}
                  onChange={(e) => {
                    setSaved(false);
                    setInterests(
                      e.target.checked
                        ? [...interests, category]
                        : interests.filter((c) => c !== category),
                    );
                  }}
                />
                <span className={`interest-symbol symbol-${i % 4}`}>
                  <Icon
                    name={["spark", "people", "calendar", "play"][i % 4]}
                    size={25}
                  />
                </span>
                <strong>{category}</strong>
                <span className="interest-check">
                  {interests.includes(category) ? "✓" : "+"}
                </span>
              </label>
            ))}
          </div>
          <div className="preferences-actions">
            <span className="muted">
              {interests.length} selected · Choosing none keeps discovery broad.
            </span>
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save interests"}
            </button>
          </div>
          {saved && (
            <div className="success-message" role="status">
              Your interests are saved.{" "}
              <Link to="/">See your recommendations →</Link>
            </div>
          )}
        </form>
      )}
    </Layout>
  );
}
