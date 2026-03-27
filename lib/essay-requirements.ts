export interface EssayRequirementSummaryRow {
  school_id: string;
  display_title: string | null;
  application_type: string | null;
  essay_count_summary: string | null;
  word_limit_summary: string | null;
}

export interface StructuredEssayPromptRow {
  id: string;
  prompt_text: string;
  word_limit: number | null;
  section_key?: string | null;
  section_title?: string | null;
  section_order?: number | null;
  prompt_order?: number | null;
  prompt_title?: string | null;
}

export interface EssayRequirementPrompt {
  id: string;
  promptText: string;
  wordLimit: number | null;
  promptTitle: string | null;
  order: number;
}

export interface EssayRequirementSection {
  key: string;
  title: string;
  order: number;
  displayStyle: "numbered_list" | "essay_blocks";
  prompts: EssayRequirementPrompt[];
}

export interface EssayRequirementsViewModel {
  mode: "rich" | "legacy";
  title: string;
  summary: {
    applicationType: string | null;
    essayCountSummary: string | null;
    wordLimitSummary: string | null;
  } | null;
  sections: EssayRequirementSection[];
  legacyPrompts: Array<{
    id: string;
    promptText: string;
    wordLimit: number | null;
  }>;
}

function hasStructuredMetadata(
  summary: EssayRequirementSummaryRow | null,
  prompts: StructuredEssayPromptRow[]
) {
  if (summary) return true;

  return prompts.some(
    (prompt) =>
      !!prompt.section_key ||
      !!prompt.section_title ||
      prompt.section_order !== null && prompt.section_order !== undefined ||
      prompt.prompt_order !== null && prompt.prompt_order !== undefined ||
      !!prompt.prompt_title
  );
}

export function buildEssayRequirementsViewModel(
  summary: EssayRequirementSummaryRow | null,
  prompts: StructuredEssayPromptRow[]
): EssayRequirementsViewModel {
  if (!hasStructuredMetadata(summary, prompts)) {
    return {
      mode: "legacy",
      title: "Essay Prompts",
      summary: null,
      sections: [],
      legacyPrompts: prompts.map((prompt) => ({
        id: prompt.id,
        promptText: prompt.prompt_text,
        wordLimit: prompt.word_limit ?? null,
      })),
    };
  }

  const sectionMap = new Map<string, EssayRequirementSection>();

  prompts.forEach((prompt, index) => {
    const sectionKey = prompt.section_key ?? `section-${prompt.section_order ?? 0}`;
    const sectionTitle = prompt.section_title ?? "Essay Prompts";
    const sectionOrder = prompt.section_order ?? 0;
    const promptOrder = prompt.prompt_order ?? index;

    const existing = sectionMap.get(sectionKey) ?? {
      key: sectionKey,
      title: sectionTitle,
      order: sectionOrder,
      displayStyle: "essay_blocks" as const,
      prompts: [],
    };

    existing.prompts.push({
      id: prompt.id,
      promptText: prompt.prompt_text,
      wordLimit: prompt.word_limit ?? null,
      promptTitle: prompt.prompt_title ?? null,
      order: promptOrder,
    });

    sectionMap.set(sectionKey, existing);
  });

  const sections = Array.from(sectionMap.values())
    .map((section) => {
      section.prompts.sort((a, b) => a.order - b.order);
      section.displayStyle = section.prompts.every((prompt) => !prompt.promptTitle)
        ? "numbered_list"
        : "essay_blocks";
      return section;
    })
    .sort((a, b) => a.order - b.order);

  return {
    mode: "rich",
    title: summary?.display_title ?? "Essay Requirements",
    summary: {
      applicationType: summary?.application_type ?? null,
      essayCountSummary: summary?.essay_count_summary ?? null,
      wordLimitSummary: summary?.word_limit_summary ?? null,
    },
    sections,
    legacyPrompts: [],
  };
}
