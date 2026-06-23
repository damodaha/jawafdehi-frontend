import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

function getDocumentProxyUrl(url: string, download = false): string {
  if (!/^https?:\/\//i.test(url)) return url;

  const params = new URLSearchParams({ url });
  if (download) params.set("download", "1");

  return `/document-preview?${params.toString()}`;
}

export function DocumentPreviewDialog({
  document,
  onOpenChange,
  open,
}: Readonly<DocumentPreviewDialogProps>) {
  const { t } = useTranslation();
  const [markdown, setMarkdown] = useState("");
  const [markdownError, setMarkdownError] = useState(false);
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(760);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || document?.type !== "markdown") {
      setMarkdown("");
      setMarkdownError(false);
      setIsLoadingMarkdown(false);
      return;
    }

    const controller = new AbortController();

    setMarkdown("");
    setMarkdownError(false);
    setIsLoadingMarkdown(true);

    fetch(getDocumentProxyUrl(document.url), { signal: controller.signal })
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
  }, [document, open]);

  useEffect(() => {
    if (!open || document?.type !== "pdf") {
      setPageCount(0);
      setPdfError(false);
    }
  }, [document, open]);

  useEffect(() => {
    const node = previewContainerRef.current;
    if (!node) return;

    const updateWidth = () => {
      setPreviewWidth(Math.max(280, Math.min(node.clientWidth - 40, 860)));
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, [document, open]);

  if (!document) return null;

  const isMarkdown = document.type === "markdown";
  const previewUrl = getDocumentProxyUrl(document.url);
  const downloadUrl = getDocumentProxyUrl(document.url, true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88vh] w-[min(96vw,960px)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base leading-6">
                {document.title}
              </DialogTitle>
              <DialogDescription>
                {isMarkdown ? t("documentPreview.markdownDescription") : t("documentPreview.pdfDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div ref={previewContainerRef} className="min-h-0 flex-1 bg-muted/25">
          {isMarkdown ? (
            <ScrollArea className="h-full">
              <div className="mx-auto max-w-3xl px-5 py-6">
                {isLoadingMarkdown && (
                  <p className="text-sm text-muted-foreground">
                    {t("documentPreview.loading")}
                  </p>
                )}

                {markdownError && (
                  <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                    {t("documentPreview.markdownError")}
                  </div>
                )}

                {!isLoadingMarkdown && !markdownError && (
                  <div className="prose prose-sm max-w-none break-words dark:prose-invert">
                    <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full">
              <div className="flex min-h-full justify-center px-5 py-6">
                <Document
                  key={previewUrl}
                  file={previewUrl}
                  loading={
                    <p className="text-sm text-muted-foreground">
                      {t("documentPreview.loading")}
                    </p>
                  }
                  error={
                    <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                      {t("documentPreview.pdfError")}
                    </div>
                  }
                  onLoadSuccess={(pdf) => {
                    setPdfError(false);
                    setPageCount(pdf.numPages);
                  }}
                  onLoadError={() => setPdfError(true)}
                  className="flex flex-col items-center gap-5"
                >
                  {!pdfError &&
                    Array.from({ length: pageCount }, (_, index) => (
                      <Page
                        key={`${previewUrl}-${index + 1}`}
                        pageNumber={index + 1}
                        width={previewWidth}
                        className="overflow-hidden rounded-lg bg-background shadow-sm ring-1 ring-border"
                      />
                    ))}
                </Document>
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="border-t bg-background px-5 py-3 sm:justify-between sm:space-x-0">
          <Button asChild variant="ghost" size="sm">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t("documentPreview.openInNewTab")}
            </a>
          </Button>

          <Button asChild variant="primary" size="sm">
            <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("documentPreview.download")}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
