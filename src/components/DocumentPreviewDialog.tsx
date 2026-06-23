import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Minus,
  PanelLeft,
  Plus,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getDocumentProxyUrl, getDocumentViewerUrl } from "@/utils/document-preview-url";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export type PreviewDocument = {
  title: string;
  type: "markdown" | "pdf";
  url: string;
};

interface DocumentPreviewDialogProps {
  document: PreviewDocument | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

interface DocumentPreviewViewerProps {
  document: PreviewDocument;
  fullPage?: boolean;
  onClose?: () => void;
}

type PdfPageSize = {
  height: number;
  width: number;
};

const PAGE_RENDER_RADIUS = 2;
const THUMBNAIL_RENDER_RADIUS = 1;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function DocumentPreviewViewer({
  document,
  fullPage = false,
  onClose,
}: Readonly<DocumentPreviewViewerProps>) {
  const { t } = useTranslation();
  const [markdown, setMarkdown] = useState("");
  const [markdownError, setMarkdownError] = useState(false);
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [pageSizes, setPageSizes] = useState<Record<number, PdfPageSize>>({});
  const [previewWidth, setPreviewWidth] = useState(760);
  const [zoom, setZoom] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pdfLoadIdRef = useRef(0);

  const isMarkdown = document.type === "markdown";
  const previewUrl = useMemo(() => getDocumentProxyUrl(document.url), [document.url]);
  const downloadUrl = useMemo(() => getDocumentProxyUrl(document.url, true), [document.url]);
  const viewerUrl = useMemo(() => getDocumentViewerUrl(document), [document]);
  const renderedPageWidth = Math.round(previewWidth * zoom);

  useEffect(() => {
    if (document.type !== "markdown") {
      setMarkdown("");
      setMarkdownError(false);
      setIsLoadingMarkdown(false);
      return;
    }

    const controller = new AbortController();

    setMarkdown("");
    setMarkdownError(false);
    setIsLoadingMarkdown(true);

    fetch(previewUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load markdown: ${response.status}`);
        }

        return response.text();
      })
      .then((text) => setMarkdown(text))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMarkdownError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingMarkdown(false);
        }
      });

    return () => controller.abort();
  }, [document.type, previewUrl]);

  useEffect(() => {
    pdfLoadIdRef.current += 1;
    setPageCount(0);
    setCurrentPage(1);
    setPdfError(false);
    setPageSizes({});
    setZoom(1);
  }, [document.url]);

  useEffect(() => {
    const node = previewContainerRef.current;
    if (!node) return;

    const updateWidth = () => {
      const reservedSpace = fullPage ? 160 : 120;
      setPreviewWidth(Math.max(320, Math.min(node.clientWidth - reservedSpace, 920)));
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [fullPage]);

  const goToPage = (page: number) => {
    const nextPage = clamp(page, 1, Math.max(pageCount, 1));
    setCurrentPage(nextPage);
    pageRefs.current[nextPage]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const zoomOut = () => setZoom((value) => clamp(Number((value - 0.1).toFixed(2)), 0.7, 1.6));
  const zoomIn = () => setZoom((value) => clamp(Number((value + 0.1).toFixed(2)), 0.7, 1.6));
  const shouldRenderPage = (pageNumber: number) =>
    Math.abs(pageNumber - currentPage) <= PAGE_RENDER_RADIUS;
  const shouldRenderThumbnail = (pageNumber: number) =>
    Math.abs(pageNumber - currentPage) <= THUMBNAIL_RENDER_RADIUS;
  const getPageHeight = (pageNumber: number, width: number) => {
    const pageSize = pageSizes[pageNumber];
    if (!pageSize) return Math.round(width * 1.414);

    return Math.round((pageSize.height / pageSize.width) * width);
  };

  useEffect(() => {
    if (isMarkdown || pageCount === 0) return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let animationFrame = 0;

    const updateCurrentPage = () => {
      animationFrame = 0;

      const readingLine = scrollContainer.scrollTop + scrollContainer.clientHeight * 0.45;
      let nextPage = 1;

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const node = pageRefs.current[pageNumber];
        if (!node) continue;

        if (node.offsetTop <= readingLine) {
          nextPage = pageNumber;
        } else {
          break;
        }
      }

      const isAtBottom =
        scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 8;
      if (isAtBottom) {
        nextPage = pageCount;
      }

      setCurrentPage((page) => (page === nextPage ? page : nextPage));
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateCurrentPage);
    };

    updateCurrentPage();
    scrollContainer.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      scrollContainer.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isMarkdown, pageCount, renderedPageWidth]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0b0c] text-white">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-black px-3">
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-white hover:bg-white/10 hover:text-white"
            aria-label={t("documentPreview.close")}
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-600 text-white">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-5 text-white">
            {document.title}
          </p>
          <p className="text-xs text-white/60">
            {isMarkdown ? t("documentPreview.textVersion") : t("documentPreview.pdfFile")}
          </p>
        </div>

        {!fullPage && (
          <Button asChild variant="ghost" size="sm" className="hidden rounded-full text-white hover:bg-white/10 hover:text-white sm:inline-flex">
            <a href={viewerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t("documentPreview.openInNewTab")}
            </a>
          </Button>
        )}

        <Button asChild variant="ghost" size="sm" className="rounded-full text-white hover:bg-white/10 hover:text-white">
          <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("documentPreview.download")}</span>
          </a>
        </Button>
      </div>

      {!isMarkdown && (
        <div className="flex shrink-0 items-center gap-2 bg-[#0b0b0c] px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full bg-[#303134] px-3 py-2 text-sm text-white/85 shadow-sm">
            <span className="hidden text-white/70 sm:inline">{t("documentPreview.page")}</span>
            <input
              className="h-7 w-11 rounded border border-white/20 bg-black/25 px-2 text-center text-sm text-white outline-none focus:border-white/60"
              aria-label={t("documentPreview.currentPage")}
              inputMode="numeric"
              value={currentPage}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(value)) setCurrentPage(clamp(value, 1, Math.max(pageCount, 1)));
              }}
              onBlur={() => goToPage(currentPage)}
              onKeyDown={(event) => {
                if (event.key === "Enter") goToPage(currentPage);
              }}
            />
            <span className="text-white/60">/ {pageCount || "-"}</span>

            <div className="mx-2 h-5 w-px bg-white/15" aria-hidden="true" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
              aria-label={t("documentPreview.previousPage")}
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
              aria-label={t("documentPreview.nextPage")}
              disabled={pageCount === 0 || currentPage >= pageCount}
              onClick={() => goToPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="mx-2 h-5 w-px bg-white/15" aria-hidden="true" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
              aria-label={t("documentPreview.zoomOut")}
              onClick={zoomOut}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/10 hover:text-white"
              aria-label={t("documentPreview.zoomIn")}
              onClick={zoomIn}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <div ref={previewContainerRef} className="flex min-h-0 flex-1 overflow-hidden bg-[#050505]">
        {!isMarkdown && (
          <aside className="hidden w-24 shrink-0 overflow-y-auto border-r border-white/10 bg-[#111214] px-3 py-4 md:block">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/70">
              <PanelLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t("documentPreview.thumbnails")}</span>
            </div>
            <Document file={previewUrl} loading={null} error={null}>
              {Array.from({ length: pageCount }, (_, index) => {
                const pageNumber = index + 1;

                return (
                  <button
                    key={`thumbnail-${previewUrl}-${pageNumber}`}
                    type="button"
                    className={cn(
                      "mb-3 block w-full rounded-md border bg-white p-1 text-left text-black transition",
                      currentPage === pageNumber
                        ? "border-blue-400 ring-2 ring-blue-400"
                        : "border-white/20 hover:border-white/70",
                    )}
                    onClick={() => goToPage(pageNumber)}
                  >
                    <span className="mb-1 block text-center text-xs font-semibold">{pageNumber}</span>
                    {shouldRenderThumbnail(pageNumber) ? (
                      <Page pageNumber={pageNumber} width={64} renderAnnotationLayer={false} renderTextLayer={false} />
                    ) : (
                      <div
                        className="flex w-16 items-center justify-center bg-slate-100 text-[10px] font-semibold text-slate-400"
                        style={{ height: getPageHeight(pageNumber, 64) }}
                      >
                        {pageNumber}
                      </div>
                    )}
                  </button>
                );
              })}
            </Document>
          </aside>
        )}

        <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto px-4 py-6">
          {isMarkdown ? (
            <div className="mx-auto min-h-full max-w-4xl rounded-sm bg-white px-6 py-8 text-slate-950 shadow-2xl sm:px-10">
              {isLoadingMarkdown && (
                <p className="text-sm text-slate-500">
                  {t("documentPreview.loading")}
                </p>
              )}

              {markdownError && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  {t("documentPreview.markdownError")}
                </div>
              )}

              {!isLoadingMarkdown && !markdownError && (
                <div className="prose prose-sm max-w-none break-words">
                  <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-full justify-center">
              <Document
                key={previewUrl}
                file={previewUrl}
                loading={
                  <p className="text-sm text-white/70">
                    {t("documentPreview.loading")}
                  </p>
                }
                error={
                  <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/70">
                    {t("documentPreview.pdfError")}
                  </div>
                }
                onLoadSuccess={(pdf) => {
                  setPdfError(false);
                  setPageCount(pdf.numPages);
                  const loadId = pdfLoadIdRef.current;

                  Promise.all(
                    Array.from({ length: pdf.numPages }, async (_, index) => {
                      const page = await pdf.getPage(index + 1);
                      const viewport = page.getViewport({ scale: 1 });

                      return [index + 1, { height: viewport.height, width: viewport.width }] as const;
                    }),
                  )
                    .then((sizes) => {
                      if (pdfLoadIdRef.current !== loadId) return;
                      setPageSizes(Object.fromEntries(sizes));
                    })
                    .catch(() => {
                      if (pdfLoadIdRef.current !== loadId) return;
                      setPageSizes({});
                    });
                }}
                onLoadError={() => setPdfError(true)}
                className="flex flex-col items-center gap-6"
              >
                {!pdfError &&
                  Array.from({ length: pageCount }, (_, index) => {
                    const pageNumber = index + 1;

                    return (
                      <div
                        key={`${previewUrl}-${pageNumber}`}
                        className="overflow-hidden"
                        ref={(node) => {
                          pageRefs.current[pageNumber] = node;
                        }}
                      >
                        {shouldRenderPage(pageNumber) ? (
                          <Page
                            pageNumber={pageNumber}
                            width={renderedPageWidth}
                            className="overflow-hidden bg-white shadow-2xl ring-1 ring-black/60"
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center bg-white text-sm font-medium text-slate-300 shadow-2xl ring-1 ring-black/60"
                            style={{
                              height: getPageHeight(pageNumber, renderedPageWidth),
                              width: renderedPageWidth,
                            }}
                          >
                            {pageNumber}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DocumentPreviewDialog({
  document,
  onOpenChange,
  open,
}: Readonly<DocumentPreviewDialogProps>) {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/85"
        className="h-[94vh] w-[min(98vw,1280px)] max-w-none overflow-hidden border-white/10 bg-[#0b0b0c] p-0 shadow-2xl sm:rounded-xl [&>button:last-child]:hidden"
      >
        <DialogTitle className="sr-only">{document.title}</DialogTitle>
        <DialogDescription className="sr-only">
          {document.type === "markdown" ? "Document text preview" : "PDF document preview"}
        </DialogDescription>
        <DocumentPreviewViewer
          document={document}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
