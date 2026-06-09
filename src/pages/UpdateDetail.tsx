import { useParams, Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { updates } from "@/data/updates";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, Download } from "lucide-react";
import Markdown from "react-markdown";
import NotFound from "./NotFound";
import { useTranslation } from "react-i18next";
import { stripMarkdown } from "@/utils/markdown";
import { cn } from "@/lib/utils";

const extractText = (node: ReactNode): string => {
    if (!node && node !== 0) return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (typeof node === "object" && "props" in node && (node as { props?: { children?: ReactNode } }).props?.children) {
        return extractText((node as { props: { children: ReactNode } }).props.children);
    }
    return "";
};

const headingId = (children: ReactNode) =>
    extractText(children)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

type DocumentResourcesProps = {
    pdfs: NonNullable<(typeof updates)[number]["pdfs"]>;
    title: string;
    viewLabel: string;
};

const DocumentResources = ({ pdfs, title, viewLabel }: DocumentResourcesProps) => (
    <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-lg border border-primary/10 bg-card shadow-sm shadow-primary/5">
            <div className="border-b border-primary/10 bg-primary/[0.04] p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background text-primary">
                        <FileText className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold leading-tight text-foreground">
                            {title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-foreground/65">
                            Source files and supporting material for this update.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-4">
                {pdfs.map((pdf, index) => (
                    <a
                        key={`${pdf.path}-${index}`}
                        href={pdf.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 rounded-lg border border-border/70 bg-background p-3 transition-colors hover:border-primary/20 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <FileText className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="line-clamp-3 text-sm font-semibold leading-5 text-foreground group-hover:text-primary">
                                {pdf.name}
                            </span>
                            <span className="mt-2 inline-flex items-center text-xs font-semibold text-primary">
                                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                {viewLabel}
                            </span>
                        </span>
                    </a>
                ))}
            </div>
        </div>
    </aside>
);

const UpdateDetail = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const update = updates.find((u) => u.id === id);

    if (!update) {
        return <NotFound />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Helmet>
                <title>{update.title} | Jawafdehi</title>
                <meta name="description" content={stripMarkdown(update.content).slice(0, 160)} />
                <meta property="og:title" content={update.title} />
                <meta property="og:description" content={stripMarkdown(update.content).slice(0, 160)} />
                <meta property="og:type" content="article" />
                {update.thumbnail && <meta property="og:image" content={update.thumbnail} />}
                <meta name="twitter:card" content="summary_large_image" />
                {update.thumbnail && <meta name="twitter:image" content={update.thumbnail} />}
            </Helmet>

            <main id="main-content" className="flex-1 py-8 md:py-12">
                <div className="container mx-auto px-4 animate-fade-in">
                    <div className="mb-8">
                        <Button
                            variant="ghost"
                            asChild
                            className="pl-0 hover:bg-transparent hover:text-primary"
                        >
                            <Link
                                to="/updates"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4 relative -top-px" />
                                <span className="mt-1">{t("updates.backToUpdates")}</span>
                            </Link>
                        </Button>
                    </div>

                    <div
                        className={cn(
                            "grid gap-10",
                            update.pdfs && update.pdfs.length > 0
                                ? "lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"
                                : "mx-auto max-w-4xl",
                        )}
                    >
                        <article className="prose prose-slate dark:prose-invert lg:prose-xl max-w-none">
                            <div className="mb-8 not-prose">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{update.title}</h1>
                                <div className="flex items-center text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span className="mt-1">{update.date}</span>
                                </div>
                            </div>

                            <div className="markdown-content">
                                <Markdown components={markdownComponents}>
                                    {update.content}
                                </Markdown>
                            </div>
                        </article>

                        {update.pdfs && update.pdfs.length > 0 && (
                            <DocumentResources
                                pdfs={update.pdfs}
                                title={t("updates.documentsAndResources")}
                                viewLabel={t("updates.view")}
                            />
                        )}
                    </div>
                </div>
            </main>
      
        </div>
    );
};

export default UpdateDetail;
