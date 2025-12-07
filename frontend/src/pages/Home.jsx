import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [token, setToken] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Load token on page load
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("http://localhost:8080/events");
        const data = await res.json();
        setEvents(data.slice(0, 3));
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    }
    fetchEvents();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.reload();
  }

  function goToDashboard() {
    if (!token) return navigate("/login");
    navigate("/dashboard");
  }

  function goToCreateEvent() {
    if (!token) return navigate("/login");
    navigate("/create");
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10 bg-gray-50 relative">
      <div className="absolute top-6 right-6">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition"
          >
            Account
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg p-2 z-20">
              {!token ? (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded hover:bg-gray-100"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={goToDashboard}
                    className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                  >
                    Dashboard
                  </button>

                  <button
                    onClick={goToCreateEvent}
                    className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                  >
                    Create Event
                  </button>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded hover:bg-red-100 text-red-600"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-center mb-12 max-w-2xl mt-12">
        <h1 className="text-4xl font-extrabold">Penn Campus Event System</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Discover, register, and manage events across campus.
        </p>
      </div>
      <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Upcoming Events
        </h2>
        <div className="flex justify-center gap-6 flex-wrap mb-8">
          {events.length > 0 ? (
            events.map((event) => (
              <Link
                key={event._id}
                to={`/events/${event._id}`}
                className="w-72 bg-white shadow-md rounded-xl p-5 border hover:shadow-xl transition"
              >
                <h3 className="text-xl font-bold mb-1">{event.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {event.description}
                </p>
                <p className="text-gray-500 text-xs mt-3">
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-gray-500">No events available yet.</p>
          )}
        </div>
        <div className="flex justify-center">
          <Link
            to="/events"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            View More Events
          </Link>
        </div>
      </div>
    </div>
  );
}
