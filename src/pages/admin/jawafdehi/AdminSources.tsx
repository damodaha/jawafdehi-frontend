import ResourceTable, { type Column } from "@/components/admin/ResourceTable";
import { listSources } from "@/services/admin-api";
import { Badge } from "@/components/ui/badge";

type Row = Record<string, unknown>;

const str = (v: unknown): string => (v == null ? "—" : String(v));

const columns: Column<Row>[] = [
  { header: "Title", cell: (r) => <span className="font-medium">{str(r.title)}</span> },
  { header: "Type", cell: (r) => <Badge variant="secondary">{str(r.source_type ?? r.type)}</Badge> },
  {
    header: "URL",
    cell: (r) => {
      const url = str(r.url);
      return url === "—" ? (
        url
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          {url.length > 60 ? `${url.slice(0, 57)}…` : url}
        </a>
      );
    },
  },
];

const PAGE_SIZE = 25;

export default function AdminSources() {
  return (
    <ResourceTable<Row>
      title="Document Sources"
      description="Document sources backing Jawafdehi cases."
      columns={columns}
      pageSize={PAGE_SIZE}
      rowKey={(r) => str(r.id)}
      fetchPage={(page) => listSources<Row>({ page, page_size: PAGE_SIZE })}
    />
  );
}
