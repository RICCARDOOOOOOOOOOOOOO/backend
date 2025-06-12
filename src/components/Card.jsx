export default function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm p-6 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800 ${className}`}
    >
      {children}
    </div>
  );
}
