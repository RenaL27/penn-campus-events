import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const [editData, setEditData] = useState({});
  const userId = localStorage.getItem("userId");

  async function loadEvent() {
    try {
      const res = await fetch(`http://localhost:8080/events/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load event");
        return;
      }

      setEvent(data);
      setEditData(data);

      if (data.attendees?.some((u) => u._id === userId)) setStatus("attending");
      else if (data.waitlist?.some((u) => u._id === userId)) setStatus("waitlisted");
      else setStatus("none");

    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function handleRSVP() {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in.");

    try {
      const res = await fetch(`http://localhost:8080/events/${id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);
      alert(data.message);

      loadEvent();
    } catch {
      alert("Something went wrong.");
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
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8080/events/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      alert("Event updated!");
      setShowEdit(false);
      loadEvent();

    } catch {
      alert("Error updating event.");
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 flex flex-col items-center p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <AnimatePresence>
        {event && (
          <motion.div
            className="bg-white shadow-lg rounded-xl p-8 max-w-2xl w-full"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <p className="text-gray-600 mt-4">{event.description}</p>

            <div className="mt-6 space-y-2">
              <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {event.time}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Organizer:</strong> {event.organizer?.name}</p>
              <p><strong>Capacity:</strong> {event.capacity}</p>
              <p><strong>Attendees:</strong> {event.attendees.length}</p>
              <p><strong>Waitlist:</strong> {event.waitlist.length}</p>
            </div>
            <motion.button
              onClick={handleRSVP}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 w-full py-2 bg-blue-600 text-white rounded-lg"
            >
              {getButtonLabel()}
            </motion.button>

            {event.organizer?._id === userId && (
              <div className="mt-8 space-y-3">
                <h2 className="text-xl font-bold">Organizer Tools</h2>
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
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                  <input
                    type="date"
                    value={editData.date?.slice(0,10)}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                  <input
                    type="time"
                    value={editData.time}
                    onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                  <input
                    type="number"
                    value={editData.capacity}
                    onChange={(e) => setEditData({ ...editData, capacity: e.target.value })}
                    className="w-full border p-2 rounded"
                  />

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="w-full py-2 bg-green-600 text-white rounded"
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

      <Link
        to="/events"
        className="mt-6 text-blue-600 underline"
      >
        ← Back to Events
      </Link>
    </motion.div>
  );
}
