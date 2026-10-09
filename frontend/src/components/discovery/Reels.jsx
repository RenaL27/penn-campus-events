import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, API_BASE, isLoggedIn, eventDate } from "../../utils/api";
import Icon from "./Icon";
import { Avatar } from "./EventCard";
import { ErrorMessage, EmptyState, Loading, Pagination } from "./Feedback";
function Comments({ reelId, onAdded }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api(
      `/reels/${reelId}/comments?page=${page}`,
      "GET",
      null,
      true,
      controller.signal,
    )
      .then((d) => {
        setComments(d.comments);
        setTotal(d.total);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reelId, page, revision]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/reels/${reelId}/comments`, "POST", { text });
      setText("");
      setPage(1);
      setRevision((r) => r + 1);
      onAdded();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const like = async (comment) => {
    setBusy(true);
    setError("");
    try {
      const result = await api(
        `/reels/${reelId}/comments/${comment._id}/like`,
        "PUT",
        { liked: !comment.liked },
      );
      setComments((list) =>
        list.map((c) => (c._id === comment._id ? { ...c, ...result } : c)),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="comments-panel">
      <h3>
        Conversation <span>{total}</span>
      </h3>
      <ErrorMessage error={error} />
      {loading ? (
        <p className="muted" role="status">
          Loading comments…
        </p>
      ) : comments.length ? (
        comments.map((c) => (
          <div className="comment-row" key={c._id}>
            <Avatar user={c.author} small />
            <div>
              <strong>{c.author?.name || "Student"}</strong>
              <p>{c.text}</p>
            </div>
            <button
              aria-label={`Like comment by ${c.author?.name || "student"}`}
              aria-pressed={c.liked}
              disabled={busy || !isLoggedIn()}
              className={`comment-like ${c.liked ? "liked" : ""}`}
              onClick={() => like(c)}
            >
              <Icon name="heart" size={16} />
              {c.likeCount}
            </button>
          </div>
        ))
      ) : (
        <p className="muted">Start the conversation.</p>
      )}
      <Pagination
        page={page}
        pages={Math.ceil(total / 20)}
        onChange={setPage}
      />
      {isLoggedIn() ? (
        <form className="comment-form" onSubmit={submit}>
          <input
            className="field"
            aria-label="Write a comment"
            placeholder="Leave a comment…"
            value={text}
            maxLength={1000}
            required
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="button button-small"
            disabled={busy || !text.trim()}
          >
            Post
          </button>
        </form>
      ) : (
        <Link className="text-link" to="/login">
          Log in to comment or like
        </Link>
      )}
    </section>
  );
}
function ReelCard({ initial }) {
  const [reel, setReel] = useState(initial);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const video = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const element = video.current;
    if (!element || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) element.pause();
        // Playback remains user initiated, so scrolling never produces surprise audio.
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.pause();
    };
  }, []);
  const like = async () => {
    if (!isLoggedIn()) return navigate("/login");
    setBusy(true);
    setError("");
    try {
      const result = await api(`/reels/${reel._id}/like`, "PUT", {
        liked: !reel.liked,
      });
      setReel((r) => ({ ...r, ...result }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    const url = `${window.location.origin}/reels/${reel._id}`;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: reel.event.title,
          text: reel.caption,
          url,
        });
        setMessage("Reel shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied. Send it to a friend.");
      } else {
        setShareUrl(url);
        setMessage("Copy this link to share the Reel.");
        return;
      }
      if (isLoggedIn()) {
        const result = await api(`/reels/${reel._id}/share`, "POST");
        setReel((r) => ({ ...r, ...result }));
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setShareUrl(url);
        setMessage("Copy this link to share the Reel.");
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="reel-card">
      <div className="reel-video-frame">
        <video
          ref={video}
          controls
          playsInline
          loop
          preload="metadata"
          src={`${API_BASE}${reel.videoUrl}`}
          aria-label={`Event Reel: ${reel.event.title}`}
          onError={() =>
            setError(
              "This video could not be played. Try another browser or refresh.",
            )
          }
        />
        <span className="reel-badge">
          <Icon name="play" size={14} />
          CAMPUS IN MOTION
        </span>
      </div>
      <div className="reel-content">
        <div className="reel-author">
          <Avatar user={reel.author} small />
          <strong>{reel.author?.name || "Campus organizer"}</strong>
        </div>
        <Link className="reel-title" to={`/events/${reel.event._id}`}>
          {reel.event.title} <Icon name="arrow" />
        </Link>
        <p className="muted">
          {eventDate(reel.event.date)} · {reel.event.location}
        </p>
        <p className="reel-caption">{reel.caption}</p>
        <div className="reel-actions">
          <button
            className={reel.liked ? "liked" : ""}
            aria-label="Like Reel"
            aria-pressed={reel.liked}
            disabled={busy}
            onClick={like}
          >
            <Icon name="heart" />
            {reel.likeCount}
          </button>
          <button
            aria-label="Show comments"
            aria-expanded={commentsOpen}
            onClick={() => setCommentsOpen(!commentsOpen)}
          >
            <Icon name="comment" />
            {reel.commentCount}
          </button>
          <button aria-label="Share Reel" disabled={busy} onClick={share}>
            <Icon name="share" />
            {reel.shareCount}
          </button>
          <Link to={`/events/${reel.event._id}`} className="text-link">
            View event →
          </Link>
        </div>
        <ErrorMessage error={error} />
        {message && (
          <p className="share-message" role="status">
            {message}
          </p>
        )}
        {shareUrl && (
          <input
            className="field"
            aria-label="Reel share link"
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
          />
        )}
        {commentsOpen && (
          <Comments
            reelId={reel._id}
            onAdded={() =>
              setReel((r) => ({ ...r, commentCount: r.commentCount + 1 }))
            }
          />
        )}
      </div>
    </article>
  );
}
export function ReelUpload({ onUploaded }) {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const input = useRef(null);
  useEffect(() => {
    api("/events")
      .then((events) => {
        const mine = events.filter(
          (e) => e.organizer?._id === localStorage.getItem("userId"),
        );
        setEvents(mine);
        setEventId(mine[0]?._id || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file || file.size > 50 * 1024 * 1024)
      return setError("Choose an MP4 or WebM video, up to 50 MB.");
    const body = new FormData();
    body.append("eventId", eventId);
    body.append("caption", caption);
    body.append("video", file);
    setBusy(true);
    try {
      const reel = await api("/reels", "POST", body);
      setFile(null);
      setCaption("");
      if (input.current) input.current.value = "";
      onUploaded(reel);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="upload-panel" onSubmit={submit}>
      <h3>Give your event a moment</h3>
      <p className="muted">
        Upload a short event preview. MP4 or WebM, up to 50 MB.
      </p>
      <ErrorMessage error={error} />
      {loading ? (
        <p role="status">Loading your events…</p>
      ) : !events.length ? (
        <p>
          <Link className="text-link" to="/create">
            Create an event
          </Link>{" "}
          before publishing a Reel.
        </p>
      ) : (
        <>
          <label className="field-label">
            Your event
            <select
              className="field"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              required
            >
              {events.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Video
            <input
              ref={input}
              className="field"
              type="file"
              accept="video/mp4,video/webm"
              required
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          <label className="field-label">
            Caption
            <textarea
              className="field"
              maxLength={1000}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What should people know?"
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Uploading video…" : "Publish Reel"}
          </button>
        </>
      )}
    </form>
  );
}
export default function Reels({ reelId }) {
  const [data, setData] = useState({ reels: [], pages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api(
      reelId ? `/reels/${reelId}` : `/reels?page=${page}`,
      "GET",
      null,
      true,
      controller.signal,
    )
      .then((d) => setData(reelId ? { reels: [d], pages: 1 } : d))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reelId, page, revision]);
  return (
    <div className="reels-section">
      <div className="reels-intro">
        <p className="feed-explanation">
          A closer look at what’s happening. Press play, find your people.
        </p>
        {!reelId && (
          <button
            className="button button-outline button-small"
            onClick={() =>
              isLoggedIn() ? setUploadOpen(!uploadOpen) : navigate("/login")
            }
          >
            <Icon name="plus" size={16} />
            {uploadOpen ? "Close upload" : "Publish a Reel"}
          </button>
        )}
      </div>
      {uploadOpen && (
        <ReelUpload
          onUploaded={(reel) => {
            setUploadOpen(false);
            setRevision((r) => r + 1);
            navigate(`/reels/${reel._id}`);
          }}
        />
      )}
      <ErrorMessage error={error} />
      {loading ? (
        <Loading />
      ) : (
        !error && (
          <>
            {data.reels.length ? (
              <div className="reel-grid">
                {data.reels.map((reel) => (
                  <ReelCard key={reel._id} initial={reel} />
                ))}
              </div>
            ) : (
              <EmptyState title="Campus has a story to tell">
                Be the first to share a Reel for an event you’re hosting.
              </EmptyState>
            )}
            <Pagination page={page} pages={data.pages} onChange={setPage} />
          </>
        )
      )}
    </div>
  );
}
