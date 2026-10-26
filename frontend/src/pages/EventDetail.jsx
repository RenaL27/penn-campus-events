import { eventArtwork } from "../utils/artwork";
import { CATEGORIES, EVENT_TYPES } from "../utils/discovery";
import Layout from "../components/discovery/Layout";
import Icon from "../components/discovery/Icon";
import { eventDate, eventTime } from "../utils/api";
import { api } from "../utils/api";
import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const [editData, setEditData] = useState({});
  const userId = localStorage.getItem("userId");

  const loadEvent = useCallback(async () => {
    try {
      const data = await api(`/events/${id}`);
      setError("");
      setEvent(data);
      setEditData(data);

      if (data.attendees?.some((u) => u._id === userId)) setStatus("attending");
      else if (data.waitlist?.some((u) => u._id === userId))
        setStatus("waitlisted");
      else setStatus("none");
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  async function handleRSVP() {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    setActionMessage("");
    try {
      const data = await api(`/events/${id}/rsvp`, "POST");
      setActionMessage(data.message);
      await loadEvent();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function getButtonLabel() {
    if (status === "attending") return "Unregister";
    if (status === "waitlisted") return "Leave Waitlist";
    if (event.attendees.length < event.capacity) return "Register";
    return "Join Waitlist";
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/events/${id}`, "PUT", editData);
      setActionMessage("Event updated.");
      setShowEdit(false);
      await loadEvent();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <motion.div
        className="event-detail-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {loading && <p>Loading...</p>}
        {error && (
          <p className="text-red-500" role="alert">
            {error}
          </p>
        )}

        <AnimatePresence>
          {event && (
            <motion.div
              className="event-detail-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <img className="detail-cover" src={eventArtwork(event)} alt="" />
              <header className="event-detail-header">
                <p className="eyebrow">{event.category || "CAMPUS EVENT"}</p>
                <h1>{event.title}</h1>
                <div className="event-detail-host">
                  <Icon name="people" size={17} />
                  <span>
                    Hosted by {event.organizer?.name || "Campus organizer"}
                  </span>
                  <span className="type-tag">
                    {event.eventType || "In-Person"}
                  </span>
                </div>
              </header>
              <div className="event-detail-content">
                <div className="event-detail-facts">
                  <div>
                    <Icon name="calendar" />
                    <span>
                      <small>Date & time</small>
                      <strong>{eventDate(event.date)}</strong>
                      <span>{eventTime(event.time)}</span>
                    </span>
                  </div>
                  <div>
                    <Icon name="pin" />
                    <span>
                      <small>Location</small>
                      <strong>{event.location}</strong>
                    </span>
                  </div>
                  <div>
                    <Icon name="people" />
                    <span>
                      <small>Registration</small>
                      <strong>
                        {event.attendees.length} of {event.capacity} places
                        filled
                      </strong>
                      <span>{event.waitlist.length} on the waitlist</span>
                    </span>
                  </div>
                </div>
                <section className="event-about">
                  <h2>About this event</h2>
                  <p>{event.description}</p>
                </section>
              </div>
              <motion.button
                onClick={handleRSVP}
                disabled={busy}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="button event-register"
              >
                {busy ? "Updating…" : getButtonLabel()}
              </motion.button>

              {actionMessage && (
                <p className="registration-feedback" role="status">
                  {actionMessage}{" "}
                  {status === "attending" && (
                    <Link to="/dashboard">View calendar →</Link>
                  )}
                </p>
              )}

              {event.organizer?._id === userId && (
                <div className="mt-8 space-y-3">
                  <h2 className="text-xl font-bold">Organizer Tools</h2>
                  <Link
                    className="block text-blue-600 underline"
                    to="/?tab=reels"
                  >
                    Publish a Reel for your event →
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="w-full py-2 bg-yellow-500 text-white rounded-lg"
                    onClick={() => setShowEdit(!showEdit)}
                  >
                    Edit Event
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="w-full py-2 bg-gray-700 text-white rounded-lg"
                    onClick={() => setShowAttendees(!showAttendees)}
                  >
                    View Attendees
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="w-full py-2 bg-gray-800 text-white rounded-lg"
                    onClick={() => setShowWaitlist(!showWaitlist)}
                  >
                    View Waitlist
                  </motion.button>
                </div>
              )}
              <AnimatePresence>
                {showEdit && (
                  <motion.form
                    onSubmit={handleEditSubmit}
                    className="mt-6 space-y-4"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <h3 className="text-lg font-bold">Edit Event</h3>
                    <label className="block">
                      Category
                      <select
                        required
                        value={editData.category || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, category: e.target.value })
                        }
                        className="w-full border p-2 rounded"
                      >
                        <option value="">Choose a category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      Event type
                      <select
                        value={editData.eventType || "In-Person"}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            eventType: e.target.value,
                          })
                        }
                        className="w-full border p-2 rounded"
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />
                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          description: e.target.value,
                        })
                      }
                      className="w-full border p-2 rounded"
                    />
                    <input
                      type="date"
                      value={editData.date?.slice(0, 10)}
                      onChange={(e) =>
                        setEditData({ ...editData, date: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />
                    <input
                      type="time"
                      value={editData.time}
                      onChange={(e) =>
                        setEditData({ ...editData, time: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) =>
                        setEditData({ ...editData, location: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />
                    <input
                      type="number"
                      value={editData.capacity}
                      onChange={(e) =>
                        setEditData({ ...editData, capacity: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      className="w-full py-2 bg-green-600 text-white rounded"
                      disabled={busy}
                    >
                      Save Changes
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showAttendees && (
                  <motion.div
                    className="mt-6 bg-gray-100 p-4 rounded-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="font-bold text-lg mb-2">Attendees</h3>
                    {event.attendees.length === 0 ? (
                      <p>No attendees yet.</p>
                    ) : (
                      <ul className="list-disc ml-6 space-y-1">
                        {event.attendees.map((user) => (
                          <li key={user._id}>
                            <strong>{user.name}</strong> — @{user.username}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showWaitlist && (
                  <motion.div
                    className="mt-6 bg-gray-100 p-4 rounded-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="font-bold text-lg mb-2">Waitlist</h3>
                    {event.waitlist.length === 0 ? (
                      <p>No one on the waitlist.</p>
                    ) : (
                      <ul className="list-disc ml-6 space-y-1">
                        {event.waitlist.map((user) => (
                          <li key={user._id}>
                            <strong>{user.name}</strong> — @{user.username}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <Link to="/events" className="mt-6 text-blue-600 underline">
          ← Back to Events
        </Link>
      </motion.div>
    </Layout>
  );
}
