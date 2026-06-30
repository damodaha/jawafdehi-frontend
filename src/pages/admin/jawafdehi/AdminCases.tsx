import ResourceTable, { type Column } from "@/components/admin/ResourceTable";
import { listCases } from "@/services/admin-api";
import { Badge } from "@/components/ui/badge";

type Row = Record<string, unknown>;

const str = (v: unknown): string => (v == null ? "—" : String(v));

const columns: Column<Row>[] = [
  { header: "Title", cell: (r) => <span className="font-medium">{str(r.title)}</span> },
  { header: "Slug", cell: (r) => <span className="font-mono text-xs">{str(r.slug)}</span> },
  { header: "Status", cell: (r) => <Badge variant="secondary">{str(r.status)}</Badge> },
  { header: "Updated", cell: (r) => str(r.updated_at ?? r.modified) },
];

const PAGE_SIZE = 25;

export default function AdminCases() {
  return (
    <ResourceTable<Row>
      title="Jawafdehi Cases"
      description="Accountability cases. Full create / edit / publish lands next; this is the read view."
      columns={columns}
      pageSize={PAGE_SIZE}
      rowKey={(r) => str(r.slug ?? r.id)}
      fetchPage={(page) =>
        listCases<Row>({ page, page_size: PAGE_SIZE })
      }
    />
  );
}
