import { Link, useNavigate } from "react-router-dom";
import ResourceTable, { type Column } from "@/components/admin/ResourceTable";
import { listCases } from "@/services/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Row = Record<string, unknown>;

const str = (v: unknown): string => (v == null ? "—" : String(v));

const columns: Column<Row>[] = [
  { header: "Title", cell: (r) => <span className="font-medium">{str(r.title)}</span> },
  { header: "Slug", cell: (r) => <span className="font-mono text-xs">{str(r.slug)}</span> },
  { header: "Type", cell: (r) => str(r.case_type) },
  { header: "State", cell: (r) => <Badge variant="secondary">{str(r.state ?? r.status)}</Badge> },
  { header: "Updated", cell: (r) => str(r.updated_at ?? r.modified) },
];

const PAGE_SIZE = 25;

export default function AdminCases() {
  const navigate = useNavigate();
  return (
    <ResourceTable<Row>
      title="Jawafdehi Cases"
      description="Accountability / corruption cases. Full create / edit / delete."
      columns={columns}
      pageSize={PAGE_SIZE}
      rowKey={(r) => str(r.slug ?? r.id)}
      headerAction={
        <Button asChild size="sm">
          <Link to="/admin/jawafdehi/cases/new">
            <Plus className="mr-1 h-4 w-4" /> New case
          </Link>
        </Button>
      }
      onRowClick={(r) => {
        const slug = r.slug;
        if (typeof slug === "string" && slug)
          navigate(`/admin/jawafdehi/cases/${encodeURIComponent(slug)}/edit`);
      }}
      fetchPage={(page) => listCases<Row>({ page, page_size: PAGE_SIZE })}
    />
  );
}
