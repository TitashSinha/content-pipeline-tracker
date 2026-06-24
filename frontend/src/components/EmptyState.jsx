export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="text-[2rem] text-muted select-none">✦</div>
      <h3 className="text-[1rem] font-bold text-ink">{title}</h3>
      {message && <p className="text-muted text-[.88rem] max-w-xs">{message}</p>}
      {action}
    </div>
  );
}
