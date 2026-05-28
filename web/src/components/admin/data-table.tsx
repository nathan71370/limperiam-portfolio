import { cn } from "@/lib/cn";

type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
};

export function DataTable<T extends { id: number | string }>({
  rows,
  columns,
  empty,
}: {
  rows: T[];
  columns: Column<T>[];
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-line p-12 text-center text-[14px] text-ink-mute">
        {empty ?? "Aucun élément."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-line overflow-hidden">
      <table className="w-full text-[14px]">
        <thead className="bg-stage-2">
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                style={c.width ? { width: c.width } : undefined}
                className={cn(
                  "text-[11px] uppercase tracking-[1.5px] text-ink-mute px-4 py-3",
                  c.align === "right"
                    ? "text-right"
                    : c.align === "center"
                      ? "text-center"
                      : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-line hover:bg-stage-2/50"
            >
              {columns.map((c, i) => (
                <td
                  key={i}
                  className={cn(
                    "px-4 py-3 align-middle",
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left",
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
