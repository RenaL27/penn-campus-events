import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const userId = localStorage.getItem("userId");

  const [attending, setAttending] = useState([]);
  const [waitlisted, setWaitlisted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("http://localhost:8080/events");
        const data = await res.json();

        if (!res.ok) {
          setError("Failed to load events.");
          return;
        }
        const attendingEvents = data.filter((event) =>
          event.attendees?.includes(userId)
        );

        const waitlistedEvents = data.filter((event) =>
          event.waitlist?.includes(userId)
        );

        setAttending(attendingEvents);
        setWaitlisted(waitlistedEvents);

      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("Something went wrong loading your dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center relative">
      <Link
        to="/"
        className="absolute top-6 left-6 text-blue-600 underline hover:text-blue-800"
      >
        ← Back to Home
      </Link>

      <h1 className="text-4xl font-bold mb-6">Your Dashboard</h1>

      {!userId && (
        <p className="text-red-500 text-lg">
          You are not logged in. This page requires authentication.
        </p>
      )}

      {loading && <p className="text-gray-500 text-lg">Loading your events...</p>}
      {error && <p className="text-red-500 text-lg">{error}</p>}

      {!loading && !error && userId && (
        <div className="w-full max-w-5xl mt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Events You're Attending</h2>
            <div className="h-80 overflow-y-auto space-y-4 pr-2">
              {attending.length > 0 ? (
                attending.map((event) => (
                  <Link
                    key={event._id}
                    to={`/events/${event._id}`}
                    className="block bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition"
                  >
                    <h3 className="text-lg font-bold">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(event.date).toLocaleDateString()} — {event.time}
                    </p>
                    <p className="text-sm mt-1">📍 {event.location}</p>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500">You are not attending any events.</p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Waitlisted Events</h2>

            <div className="h-80 overflow-y-auto space-y-4 pr-2">
              {waitlisted.length > 0 ? (
                waitlisted.map((event) => (
                  <Link
                    key={event._id}
                    to={`/events/${event._id}`}
                    className="block bg-yellow-50 border border-yellow-200 p-4 rounded-lg hover:bg-yellow-100 transition"
                  >
                    <h3 className="text-lg font-bold">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(event.date).toLocaleDateString()} — {event.time}
                    </p>
                    <p className="text-sm mt-1">📍 {event.location}</p>
                    <p className="text-xs text-yellow-700 mt-1 font-medium">
                      You are on the waitlist
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500">You are not waitlisted for any events.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
