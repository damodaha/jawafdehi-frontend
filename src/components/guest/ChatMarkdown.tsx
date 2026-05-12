import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMarkdownProps {
  content: string;
  tone?: "assistant" | "user";
}

const baseClass =
  "text-sm leading-7 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 [&_li]:pl-1 [&_strong]:font-semibold [&_em]:italic [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:p-3 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_a]:underline [&_a]:underline-offset-2";

export function ChatMarkdown({ content, tone = "assistant" }: ChatMarkdownProps) {
  const isUser = tone === "user";
  const className = `${baseClass} ${
    isUser
      ? "text-primary-foreground [&_a]:text-primary-foreground [&_blockquote]:border-primary-foreground/50 [&_code]:bg-primary-foreground/15 [&_pre]:bg-primary-foreground/15"
      : "text-foreground [&_a]:text-primary [&_blockquote]:border-border [&_code]:bg-muted [&_pre]:bg-muted"
  }`;

  return (
    <div className={className}>
      <Markdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
