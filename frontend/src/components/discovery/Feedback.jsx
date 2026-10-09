import { Link } from "react-router-dom";
import Icon from "./Icon";
export function ErrorMessage({ error }) {
  return error ? (
    <div className="error-message" role="alert">
      {error}
    </div>
  ) : null;
}
export function EmptyState({ title, children, link, label }) {
  return (
    <div className="empty-state">
      <Icon name="spark" size={30} />
      <h2>{title}</h2>
      <p>{children}</p>
      {link && (
        <Link className="button" to={link}>
          {label}
        </Link>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading-state" role="status">
      <span className="loading-dot" />
      Finding your next campus moment…
    </div>
  );
}
export function Pagination({ page, pages, onChange }) {
  return pages > 1 ? (
    <div className="pagination">
      <button
        className="button button-outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        className="button button-outline"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  ) : null;
}
