import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { askPublicQuestionStream, getPublicChatSessionId } from "@/services/public-chat";
import type { CaseDetail } from "@/types/jds";
import type { GuestCaseChatCitation, GuestCaseChatMessage } from "@/types/guest-chat";
import type { PublicChatHistoryItem, PublicChatSource } from "@/types/public-chat";

interface UseGuestCaseChatOptions {
  caseId: number;
  caseTitle: string;
  caseData: CaseDetail;
  defaultSuggestedQuestions: string[];
}

interface SubmitCaseQuestionInput {
  question: string;
  history: PublicChatHistoryItem[];
}

function buildCaseScopedQuestion(caseId: number, caseData: CaseDetail, question: string) {
  const identifier = caseData.case_id || String(caseId);
  return `For Jawafdehi case ${identifier} (${caseData.title}), answer this case-page question: ${question}`;
}

function sourceToCitation(source: PublicChatSource, index: number): GuestCaseChatCitation {
  const sourceId =
    Number(source.source_id) ||
    Number(source.document_id) ||
    Number(source.chunk_id) ||
    index + 1;

  return {
    sourceId,
    sourceTitle: source.title,
    reason: source.snippet,
  };
}

export function useGuestCaseChat({
  caseId,
  caseTitle,
  caseData,
  defaultSuggestedQuestions,
}: UseGuestCaseChatOptions) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<GuestCaseChatMessage[]>([]);
  const [followups, setFollowups] = useState<string[]>(defaultSuggestedQuestions);
  const [error, setError] = useState<string | null>(null);
  const previousDefaultSuggestedQuestionsRef = useRef(defaultSuggestedQuestions);

  const mutation = useMutation({
    mutationFn: async ({ question, history }: SubmitCaseQuestionInput) => {
      const response = await askPublicQuestionStream({
        question: buildCaseScopedQuestion(caseId, caseData, question),
        history,
        language: i18n.language,
        sessionId: getPublicChatSessionId(),
      });
      return {
        answer: response.answer_text,
        citations: response.sources.map(sourceToCitation),
        followups: response.follow_up_questions,
        origin: "public-read-adapter" as const,
      };
    },
  });
  const { reset: resetMutation } = mutation;

  useEffect(() => {
    setMessages([]);
    setError(null);
    setFollowups(defaultSuggestedQuestions);
    resetMutation();
    previousDefaultSuggestedQuestionsRef.current = defaultSuggestedQuestions;
  }, [caseId, caseTitle, defaultSuggestedQuestions, resetMutation]);

  useEffect(() => {
    const previousDefaultSuggestedQuestions =
      previousDefaultSuggestedQuestionsRef.current;

    setFollowups((current) =>
      current.length === 0 ||
      current.every((prompt) =>
        previousDefaultSuggestedQuestions.includes(prompt)
      )
        ? defaultSuggestedQuestions
        : current
    );

    previousDefaultSuggestedQuestionsRef.current = defaultSuggestedQuestions;
  }, [defaultSuggestedQuestions]);

  const submitQuestion = async (question: string) => {
    const timestamp = new Date().toISOString();
    const loadingMessageId = `assistant-loading-${Date.now()}`;
    const history = messages
      .filter((message) => !message.isLoading && !message.isError)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: question,
        timestamp,
      },
      {
        id: loadingMessageId,
        role: "assistant",
        content: "",
        timestamp,
        origin: "public-read-adapter",
        isLoading: true,
      },
    ]);
    setError(null);

    try {
      const result = await mutation.mutateAsync({ question, history });
      setMessages((current) =>
        current.map((message) =>
          message.id === loadingMessageId
            ? {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: result.answer,
                timestamp: new Date().toISOString(),
                citations: result.citations,
                origin: result.origin,
              }
            : message
        )
      );
      setFollowups(
        result.followups.length > 0 ? result.followups : defaultSuggestedQuestions
      );
    } catch {
      setError(t("guestCaseChatDrawer.errors.answerFailed"));
      setMessages((current) =>
        current.map((message) =>
          message.id === loadingMessageId
            ? {
                id: `assistant-error-${Date.now()}`,
                role: "assistant",
                content: t("guestCaseChatDrawer.errors.answerFailedMessage"),
                timestamp: new Date().toISOString(),
                origin: "public-read-adapter",
                isError: true,
              }
            : message
        )
      );
    }
  };

  return {
    messages,
    followups,
    error,
    isSubmitting: mutation.isPending,
    submitQuestion,
  };
}
