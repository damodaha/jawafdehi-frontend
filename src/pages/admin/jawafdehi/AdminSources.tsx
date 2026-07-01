import { Link, useNavigate } from "react-router-dom";
import ResourceTable, { type Column } from "@/components/admin/ResourceTable";
import { listSources } from "@/services/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Row = Record<string, unknown>;

const str = (v: unknown): string => (v == null ? "—" : String(v));

const columns: Column<Row>[] = [
  { header: "Title", cell: (r) => <span className="font-medium">{str(r.title)}</span> },
  { header: "Type", cell: (r) => <Badge variant="secondary">{str(r.source_type ?? r.type)}</Badge> },
  {
    header: "URL",
    cell: (r) => {
      // A source carries `urls` (link-role dicts); show the first link's target.
      const urls = Array.isArray(r.urls) ? (r.urls as { link?: unknown }[]) : [];
      const first = urls.find((u) => u && typeof u.link === "string");
      const url = first ? String(first.link) : str(r.url);
      return url === "—" ? (
        url
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
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
  const navigate = useNavigate();
  return (
    <ResourceTable<Row>
      title="Document Sources"
      description="Document sources backing Jawafdehi cases. Full create / edit / delete."
      columns={columns}
      pageSize={PAGE_SIZE}
      rowKey={(r) => str(r.id)}
      headerAction={
        <Button asChild size="sm">
          <Link to="/admin/jawafdehi/sources/new">
            <Plus className="mr-1 h-4 w-4" /> New source
          </Link>
        </Button>
      }
      onRowClick={(r) => {
        if (r.id != null)
          navigate(`/admin/jawafdehi/sources/${encodeURIComponent(String(r.id))}/edit`);
      }}
      fetchPage={(page) => listSources<Row>({ page, page_size: PAGE_SIZE })}
    />
  );
}
