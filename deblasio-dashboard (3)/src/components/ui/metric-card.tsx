export function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warning" | "bad";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "text-gray-900",
    good: "text-emerald-600",
    warning: "text-amber-600",
    bad: "text-red-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}
