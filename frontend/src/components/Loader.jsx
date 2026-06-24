export default function Loader({ full, label }) {
  if (full) {
    return (
      <div className="loader-full">
        <span className="spinner" />
        {label && <p className="text-muted">{label}</p>}
      </div>
    );
  }
  return <span className="spinner" />;
}
