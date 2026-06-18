import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { getArticleBySlug } from "@/services/cms-api";
import { StreamField } from "@/components/StreamField";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ArrowRight } from "lucide-react";
import NotFound from "./NotFound";
import { useTranslation } from "react-i18next";

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const UpdateDetail = () => {
    const { slug } = useParams();
    const { t } = useTranslation();

    const { data: article, isLoading, isError } = useQuery({
        queryKey: ["cms-article", slug],
        queryFn: () => getArticleBySlug(slug as string),
        enabled: Boolean(slug),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading…</p>
            </div>
        );
    }

    if (isError || !article) {
        return <NotFound />;
    }

    const description = (article.excerpt || "").slice(0, 160);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Helmet>
                <title>{article.title} | Jawafdehi</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={article.title} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="article" />
                {article.thumbnail?.url && <meta property="og:image" content={article.thumbnail.url} />}
                <meta name="twitter:card" content="summary_large_image" />
                {article.thumbnail?.url && <meta name="twitter:image" content={article.thumbnail.url} />}
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

                    <div className="mx-auto max-w-4xl">
                        <article className="prose prose-slate dark:prose-invert lg:prose-xl max-w-none">
                            <div className="mb-8 not-prose">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{article.title}</h1>
                                <div className="flex items-center text-muted-foreground">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span className="mt-1">{formatDate(article.date)}</span>
                                </div>
                            </div>

                            <div className="markdown-content">
                                <StreamField blocks={article.body} />
                            </div>
                        </article>

                        {article.related_cases && article.related_cases.length > 0 && (
                            <section className="mx-auto mt-12 max-w-4xl">
                                <h2 className="text-lg font-bold text-foreground">
                                    {t("updates.relatedCases", "Related cases")}
                                </h2>
                                <div className="mt-4 grid gap-3">
                                    {article.related_cases.map((relatedCase) => (
                                        <Link
                                            key={relatedCase.id}
                                            to={`/case/${relatedCase.slug}`}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 transition-colors hover:border-primary/20 hover:bg-primary/[0.03]"
                                        >
                                            <span className="font-semibold text-foreground">{relatedCase.title}</span>
                                            <ArrowRight className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UpdateDetail;
