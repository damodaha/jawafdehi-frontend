import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";

interface CaseOverviewSectionProps {
  description: string;
  title: string;
}

export function CaseOverviewSection({
  description,
  title,
}: Readonly<CaseOverviewSectionProps>) {
  return (
    <section id="overview" className="mb-12 scroll-mt-28">
      <h2 className="mb-6 flex items-center text-2xl font-semibold text-primary">
        <FileText className="mr-2 h-5 w-5" />
        {title}
      </h2>

      <div className="overflow-hidden">
        <div className="prose-content leading-relaxed text-primary/75 [&_p]:mb-4 [&_p]:text-[17px] [&_p]:leading-8 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:space-y-2 [&_li]:ml-6 [&_li]:pl-2 [&_li]:text-[17px] [&_li]:leading-8 [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-primary [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-primary [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-primary [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-primary [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-sm [&_td]:text-primary/75 [&_tr:nth-child(even)]:bg-muted/30 [&_caption]:mb-3 [&_caption]:text-sm [&_caption]:font-semibold [&_caption]:text-primary">
          <Markdown remarkPlugins={[remarkGfm]}>{description}</Markdown>
        </div>
      </div>
    </section>
  );
}
