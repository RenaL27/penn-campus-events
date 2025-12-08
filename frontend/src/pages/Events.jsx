import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    date: "",
    time: "",
    location: "",
    organizer: ""
  });

  async function fetchEvents() {
    try {
      setLoading(true);

      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        )
      ).toString();

      const res = await fetch(`http://localhost:8080/events?${query}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load events");
        return;
      }

      setEvents(data);

    } catch (err) {
      setError("Something went wrong while loading events.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrganizers() {
    const res = await fetch("http://localhost:8080/users/organizers");
    const data = await res.json();
    setOrganizers(data);
  }

  useEffect(() => {
    fetchEvents();
    fetchOrganizers();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-2">All Events</h1>
      <p className="text-gray-600 mb-10">Browse campus events.</p>
      <div className="bg-white shadow p-5 rounded-xl w-full max-w-4xl mb-10">
        <h2 className="text-xl font-bold mb-4">Filter Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="date"
            value={filters.date}
            onChange={(e) =>
              setFilters({ ...filters, date: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="time"
            value={filters.time}
            onChange={(e) =>
              setFilters({ ...filters, time: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Organizer name"
            value={filters.organizer}
            onChange={(e) =>
              setFilters({ ...filters, organizer: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>
      </div>

      {loading && <p>Loading events...</p>}
      {error && <p className="text-red-500 text-lg">{error}</p>}
      {!loading && !error && (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
        {events.map((event) => (
          <motion.div
          key={event._id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          <Link
            to={`/events/${event._id}`}
            className="block bg-white shadow-md rounded-xl p-6 border hover:shadow-xl transition overflow-hidden w-full h-full"
          >
            <h2 className="text-xl font-bold break-words">{event.title}</h2>
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {event.description}
            </p>
            <p className="text-gray-500 text-xs mt-4">
              📅 {new Date(event.date).toLocaleDateString()}  
              <br />
              🕒 {event.time}
            </p>
            <p className="mt-4 text-sm text-gray-700">
              📍 {event.location}
            </p>
            {event.organizer && (
              <p className="mt-2 text-xs text-gray-500">
                👤 {event.organizer?.name}
              </p>
            )}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )}
      {!loading && !error && events.length === 0 && (
        <p className="text-gray-500 text-lg mt-10">No events found.</p>
      )}

      <Link
        to="/"
        className="mt-10 text-blue-600 underline hover:text-blue-800"
      >
        ← Back to Home
      </Link>
    </div>
  );
}
