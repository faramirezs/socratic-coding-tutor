/**
 * Socratic Ask Tool
 *
 * An extension of the base `ask` tool designed specifically for the
 * Zettelkasten Socratic Tutor skill. Adds:
 *
 * 1. Question-type tagging (activation | definition | mechanism |
 *    contrast | application | synthesis | challenge)
 * 2. Narrowing-attempt tracking — auto-escalates to hint after 3 misses
 * 3. Coverage metrics display injected after each interaction
 * 4. Learner-state machine (confident | exploring | stuck | frustrated)
 * 5. Verbatim learner-quote capture stored alongside the selection
 * 6. Concept-link suggestions surfaced after a correct answer
 *
 * The tool is intentionally UI-compatible with the base `ask` tool:
 * all base fields are preserved; socratic fields are additive.
 */

import type {
  AgentTool,
  AgentToolContext,
  AgentToolResult,
  AgentToolUpdateCallback,
} from "@oh-my-pi/pi-agent-core";
import {
  type Component,
  Container,
  Markdown,
  renderInlineMarkdown,
  TERMINAL,
  Text,
} from "@oh-my-pi/pi-tui";
import { prompt, untilAborted } from "@oh-my-pi/pi-utils";
import { type Static, Type } from "@sinclair/typebox";
import type { RenderResultOptions } from "../extensibility/custom-tools/types";
import {
  getMarkdownTheme,
  type Theme,
  theme,
} from "../modes/theme/theme";
import { renderStatusLine } from "../tui";
import type { ToolSession } from ".";
import { formatErrorMessage, formatMeta, formatTitle } from "./render-utils";
import { ToolAbortError } from "./tool-errors";

// =============================================================================
// Socratic-specific enums & constants
// =============================================================================

/** The pedagogical intent of this question. Drives follow-up strategy. */
export type QuestionType =
  | "activation"   // Probe prior knowledge before introducing a concept
  | "definition"   // Ask learner to define in own words
  | "mechanism"    // Ask how / why it works
  | "contrast"     // Compare against a concept already covered
  | "application"  // Concrete use-case or scenario
  | "synthesis"    // Connect two or more covered concepts
  | "challenge";   // Push on edge-cases or failure modes

/** Inferred learner emotional / cognitive state. Affects hint strategy. */
export type LearnerState =
  | "confident"    // Clear, complete answer — move forward
  | "exploring"    // Partial answer — narrow with a follow-up
  | "stuck"        // No answer offered after prompt
  | "frustrated";  // Explicit signal or third consecutive miss

/** A coverage snapshot passed in from the skill so the tool can display it. */
export interface CoverageSnapshot {
  covered: number;          // Number of fully-covered concepts
  partial: number;          // Number of partially-covered concepts
  total: number;            // Total concepts in target-docs
  sessionMinutes: number;   // Elapsed session time in minutes
}

/** A suggested concept link to surface after a correct answer. */
export interface ConceptLinkSuggestion {
  conceptId: string;
  conceptName: string;
  relationshipType:
    | "is-a"
    | "enables"
    | "contrasts-with"
    | "applies-in"
    | "precedes";
}

const NARROWING_MAX = 3; // escalate to hint after this many narrowing questions
const OTHER_OPTION = "Other (type your own)";
const RECOMMENDED_SUFFIX = " (Recommended)";

// =============================================================================
// TypeBox schema — superset of base ask schema
// =============================================================================

const SocraticOptionItem = Type.Object({
  label: Type.String({ description: "Display label shown to learner" }),
  conceptId: Type.Optional(
    Type.String({ description: "Maps to a concept ID in target-docs/_index.md" }),
  ),
});

const SocraticQuestionItem = Type.Object({
  // ---- Base ask fields ----
  id: Type.String({ description: "Unique question ID", examples: ["q-activation-c01"] }),
  question: Type.String({ description: "The Socratic question text" }),
  options: Type.Array(SocraticOptionItem, {
    description: "Response anchors — NOT answers. They guide, not reveal.",
  }),
  multi: Type.Optional(Type.Boolean({ description: "Allow multiple selections" })),
  recommended: Type.Optional(
    Type.Number({ description: "Index of the recommended / most-expected anchor" }),
  ),

  // ---- Socratic extensions ----
  questionType: Type.Union(
    [
      Type.Literal("activation"),
      Type.Literal("definition"),
      Type.Literal("mechanism"),
      Type.Literal("contrast"),
      Type.Literal("application"),
      Type.Literal("synthesis"),
      Type.Literal("challenge"),
    ],
    { description: "Pedagogical intent — drives follow-up strategy" },
  ),
  conceptId: Type.Optional(
    Type.String({
      description: "ID from target-docs/_index.md this question targets",
    }),
  ),
  narrowingAttempt: Type.Optional(
    Type.Number({
      description:
        "0-based count of narrowing questions already asked for this concept. " +
        "When this reaches NARROWING_MAX (3), the tool switches to hint mode.",
      minimum: 0,
    }),
  ),
  hintText: Type.Optional(
    Type.String({
      description:
        "Minimum scaffolding hint to offer when learner is stuck. " +
        "Never the full answer — just enough for discovery.",
    }),
  ),
  coverage: Type.Optional(
    Type.Object(
      {
        covered: Type.Number(),
        partial: Type.Number(),
        total: Type.Number(),
        sessionMinutes: Type.Number(),
      },
      {
        description:
          "Current coverage snapshot. When provided, a metrics line is " +
          "displayed after the learner answers.",
      },
    ),
  ),
  suggestedLinks: Type.Optional(
    Type.Array(
      Type.Object({
        conceptId: Type.String(),
        conceptName: Type.String(),
        relationshipType: Type.Union([
          Type.Literal("is-a"),
          Type.Literal("enables"),
          Type.Literal("contrasts-with"),
          Type.Literal("applies-in"),
          Type.Literal("precedes"),
        ]),
      }),
      {
        description:
          "Concept links to surface after a correct answer. Agent uses these " +
          "to prompt the learner to articulate the connection before documenting it.",
      },
    ),
  ),
});

const socraticAskSchema = Type.Object({
  questions: Type.Array(SocraticQuestionItem, {
    description: "One or more Socratic questions. One question per concept per turn.",
    minItems: 1,
  }),
});

export type SocraticAskToolInput = Static<typeof socraticAskSchema>;

// =============================================================================
// Result types
// =============================================================================

export interface SocraticQuestionResult {
  // Base fields
  id: string;
  question: string;
  options: string[];
  multi: boolean;
  selectedOptions: string[];
  customInput?: string;

  // Socratic extensions
  questionType: QuestionType;
  conceptId?: string;
  learnerState: LearnerState;
  narrowingAttemptUsed: number;   // How many narrowing rounds this cycle consumed
  hintWasShown: boolean;
  verbatimQuote?: string;         // The learner's own-words formulation to store in the note
  coverageAfter?: CoverageSnapshot;
  suggestedLinksAcknowledged?: ConceptLinkSuggestion[];
}

export interface SocraticAskToolDetails {
  // Single-question fast path
  question?: string;
  options?: string[];
  multi?: boolean;
  selectedOptions?: string[];
  customInput?: string;
  questionType?: QuestionType;
  learnerState?: LearnerState;
  hintWasShown?: boolean;
  coverageLine?: string;

  // Multi-question batch
  results?: SocraticQuestionResult[];
}

// =============================================================================
// Helper utilities
// =============================================================================

function addRecommendedSuffix(labels: string[], idx?: number): string[] {
  if (idx === undefined || idx < 0 || idx >= labels.length) return labels;
  return labels.map((l, i) =>
    i === idx && !l.endsWith(RECOMMENDED_SUFFIX) ? l + RECOMMENDED_SUFFIX : l,
  );
}

function stripRecommendedSuffix(label: string): string {
  return label.endsWith(RECOMMENDED_SUFFIX)
    ? label.slice(0, -RECOMMENDED_SUFFIX.length)
    : label;
}

function getAutoSelectionOnTimeout(labels: string[], recommended?: number): string[] {
  if (labels.length === 0) return [];
  const idx = typeof recommended === "number" && recommended >= 0 && recommended < labels.length
    ? recommended
    : 0;
  return [labels[idx]];
}

/**
 * Derive learner state from the selection result.
 * - customInput present         → exploring or confident (agent must judge; default exploring)
 * - known option selected       → confident
 * - nothing selected & stuck    → stuck (caller passes explicit flag)
 */
function inferLearnerState(
  selectedOptions: string[],
  customInput?: string,
  stuckHint?: boolean,
): LearnerState {
  if (stuckHint) return "stuck";
  if (customInput !== undefined) return "exploring";   // own-words answer — agent evaluates
  if (selectedOptions.length > 0) return "confident";  // selected a known anchor
  return "stuck";
}

/**
 * Build the compact coverage metrics line.
 *
 * Example:
 *   📊 Coverage: 23% (7/30 concepts) | Velocity: 2.3%/min | Est. to 100%: 33 min
 */
function buildCoverageLine(snap: CoverageSnapshot): string {
  const effective = snap.covered + snap.partial * 0.5;
  const pct = snap.total > 0 ? Math.round((effective / snap.total) * 100) : 0;
  const velocity =
    snap.sessionMinutes > 0
      ? Math.round((pct / snap.sessionMinutes) * 10) / 10
      : 0;
  const remaining = snap.total - effective;
  const etaMin =
    velocity > 0 ? Math.round((remaining / snap.total) * 100 / velocity) : "∞";
  return (
    `📊 Coverage: ${pct}% (${snap.covered}/${snap.total} concepts) | ` +
    `Velocity: ${velocity}%/min | Est. to 100%: ${etaMin} min`
  );
}

/**
 * Build the "hint escalation" prompt injected before options
 * when narrowingAttempt >= NARROWING_MAX.
 */
function buildHintPrompt(hintText: string, questionText: string): string {
  return (
    `${questionText}\n\n` +
    `> 💡 **Hint:** ${hintText}\n\n` +
    `Take your time — what do you think now?`
  );
}

/**
 * Build the link-acknowledgement prompt shown after a correct answer
 * when suggestedLinks are provided.
 */
function buildLinkPrompt(
  links: ConceptLinkSuggestion[],
  coveredConceptName: string,
): string {
  const linkLines = links
    .map(l => `- **${l.conceptName}** (${l.relationshipType})`)
    .join("\n");
  return (
    `Great — you've got **${coveredConceptName}**. ` +
    `Before we move on, how does it connect to the following?\n\n${linkLines}\n\n` +
    `Pick the connection that feels most natural to you right now, ` +
    `or describe it in your own words.`
  );
}

// =============================================================================
// Core selection primitive (mirrors base ask, adds Socratic overlays)
// =============================================================================

interface UIContext {
  select(
    prompt: string,
    options: string[],
    options_?: {
      initialIndex?: number;
      timeout?: number;
      signal?: AbortSignal;
      outline?: boolean;
      onTimeout?: () => void;
      helpText?: string;
    },
  ): Promise<string | undefined>;
  editor(
    title: string,
    prefill?: string,
    dialogOptions?: { signal?: AbortSignal },
    editorOptions?: { promptStyle?: boolean },
  ): Promise<string | undefined>;
}

interface SelectionResult {
  selectedOptions: string[];
  customInput?: string;
  timedOut: boolean;
  cancelled?: boolean;
}

async function selectOne(
  ui: UIContext,
  questionText: string,
  optionLabels: string[],
  recommended: number | undefined,
  signal: AbortSignal | undefined,
  timeout: number | undefined,
): Promise<SelectionResult> {
  const displayLabels = addRecommendedSuffix(optionLabels, recommended);
  const choices = [...displayLabels, OTHER_OPTION];

  let timedOut = false;
  const dialogOptions = {
    initialIndex: recommended,
    timeout,
    signal,
    outline: true,
    onTimeout: () => { timedOut = true; },
    helpText: "up/down navigate  enter select  esc cancel",
  };

  const choice = signal
    ? await untilAborted(signal, () => ui.select(questionText, choices, dialogOptions))
    : await ui.select(questionText, choices, dialogOptions);

  if (choice === undefined) {
    if (!timedOut) return { selectedOptions: [], timedOut: false, cancelled: true };
    return {
      selectedOptions: getAutoSelectionOnTimeout(optionLabels, recommended),
      timedOut: true,
    };
  }

  if (choice === OTHER_OPTION && !timedOut) {
    const editorOpts = signal ? { signal } : undefined;
    const input = signal
      ? await untilAborted(signal, () =>
          ui.editor("Express it in your own words:", undefined, editorOpts, { promptStyle: true }),
        )
      : await ui.editor("Express it in your own words:", undefined, editorOpts, { promptStyle: true });
    return { selectedOptions: [], customInput: input ?? undefined, timedOut: false };
  }

  return {
    selectedOptions: [stripRecommendedSuffix(choice)],
    timedOut,
  };
}

// =============================================================================
// Main Socratic question handler
// =============================================================================

async function handleSocraticQuestion(
  ui: UIContext,
  q: SocraticAskToolInput["questions"][number],
  signal: AbortSignal | undefined,
  timeout: number | undefined,
): Promise<SocraticQuestionResult> {
  const optionLabels = q.options.map(o => o.label);
  const narrowingAttempt = q.narrowingAttempt ?? 0;
  const shouldShowHint =
    narrowingAttempt >= NARROWING_MAX && q.hintText !== undefined;

  // Inject hint into question text if escalated
  const displayQuestion = shouldShowHint && q.hintText
    ? buildHintPrompt(q.hintText, q.question)
    : q.question;

  const selection = await selectOne(
    ui,
    displayQuestion,
    optionLabels,
    q.recommended,
    signal,
    timeout,
  );

  if (selection.cancelled) {
    return {
      id: q.id,
      question: q.question,
      options: optionLabels,
      multi: q.multi ?? false,
      selectedOptions: [],
      questionType: q.questionType,
      conceptId: q.conceptId,
      learnerState: "stuck",
      narrowingAttemptUsed: narrowingAttempt,
      hintWasShown: shouldShowHint,
    };
  }

  // Determine if a verbatim quote should be captured from custom input
  const verbatimQuote = selection.customInput ?? undefined;

  const learnerState = inferLearnerState(
    selection.selectedOptions,
    selection.customInput,
  );

  // Build coverage line if snapshot was provided
  const coverageAfter = q.coverage ? q.coverage as CoverageSnapshot : undefined;
  const coverageLine = coverageAfter ? buildCoverageLine(coverageAfter) : undefined;

  // Handle suggested concept links (shown as a follow-up selector if answer is good)
  let linksAcknowledged: ConceptLinkSuggestion[] | undefined;
  if (
    learnerState !== "stuck" &&
    q.suggestedLinks &&
    q.suggestedLinks.length > 0 &&
    selection.customInput !== undefined  // Only surface links after own-words answers
  ) {
    const conceptName =
      q.suggestedLinks[0]?.conceptName ?? "this concept";
    const linkPrompt = buildLinkPrompt(
      q.suggestedLinks as ConceptLinkSuggestion[],
      conceptName,
    );
    const linkLabels = q.suggestedLinks.map(
      l => `${l.conceptName} (${l.relationshipType})`,
    );
    const linkSelection = await selectOne(
      ui,
      linkPrompt,
      linkLabels,
      0,
      signal,
      timeout,
    );
    if (!linkSelection.cancelled && linkSelection.selectedOptions.length > 0) {
      // Resolve back to the full ConceptLinkSuggestion object
      linksAcknowledged = q.suggestedLinks.filter(l =>
        linkSelection.selectedOptions.includes(
          `${l.conceptName} (${l.relationshipType})`,
        ),
      ) as ConceptLinkSuggestion[];
    }
  }

  return {
    id: q.id,
    question: q.question,
    options: optionLabels,
    multi: q.multi ?? false,
    selectedOptions: selection.selectedOptions,
    customInput: selection.customInput,
    questionType: q.questionType,
    conceptId: q.conceptId,
    learnerState,
    narrowingAttemptUsed: narrowingAttempt,
    hintWasShown: shouldShowHint,
    verbatimQuote,
    coverageAfter,
    suggestedLinksAcknowledged: linksAcknowledged,
  };
}

// =============================================================================
// Tool class
// =============================================================================

type SocraticAskParams = SocraticAskToolInput;

/**
 * SocraticAskTool — interactive Socratic questioning with coverage tracking.
 *
 * Drop-in replacement for `ask` within the Zettelkasten Socratic Tutor skill.
 * Extends every base `ask` behaviour with:
 *   - Question-type tagging for pedagogical routing
 *   - Narrowing-attempt counter with automatic hint escalation
 *   - Learner-state inference (confident / exploring / stuck / frustrated)
 *   - Coverage metrics line injected after each response
 *   - Verbatim quote capture for atomic note creation
 *   - Concept-link acknowledgement follow-up
 */
export class SocraticAskTool
  implements AgentTool<typeof socraticAskSchema, SocraticAskToolDetails>
{
  readonly name = "socratic-ask";
  readonly label = "Socratic Ask";
  readonly description =
    prompt.render(
      "Use this tool to ask Socratic questions during a Zettelkasten learning session. " +
      "Prefer this over the base `ask` tool whenever the session involves " +
      "concept discovery, coverage tracking, or atomic note creation. " +
      "Fields beyond the base ask schema:\n" +
      "- questionType: pedagogical intent (activation|definition|mechanism|contrast|application|synthesis|challenge)\n" +
      "- conceptId: maps the question to target-docs/_index.md\n" +
      "- narrowingAttempt: how many narrowing rounds already done (0-based; hint shown at 3)\n" +
      "- hintText: minimum scaffolding to show when stuck (never the full answer)\n" +
      "- coverage: current snapshot for the metrics line\n" +
      "- suggestedLinks: concept connections to surface after a correct own-words answer",
    );
  readonly parameters = socraticAskSchema;
  readonly strict = true;

  constructor(private readonly session: ToolSession) {}

  static createIf(session: ToolSession): SocraticAskTool | null {
    return session.hasUI ? new SocraticAskTool(session) : null;
  }

  #sendNotification(): void {
    const method = this.session.settings.get("ask.notify");
    if (method === "off") return;
    TERMINAL.sendNotification("Socratic question — waiting for your answer");
  }

  async execute(
    _toolCallId: string,
    params: SocraticAskParams,
    signal?: AbortSignal,
    _onUpdate?: AgentToolUpdateCallback<SocraticAskToolDetails>,
    context?: AgentToolContext,
  ): Promise<AgentToolResult<SocraticAskToolDetails>> {
    if (!context?.hasUI || !context.ui) {
      context?.abort();
      throw new ToolAbortError("SocraticAskTool requires interactive mode");
    }

    const extensionUi = context.ui;
    const ui: UIContext = {
      select: (p, opts, opts_) => extensionUi.select(p, opts, opts_),
      editor: (title, prefill, dialogOpts, editorOpts) =>
        extensionUi.editor(title, prefill, dialogOpts, editorOpts),
    };

    // Inherit timeout from base ask settings
    const planModeEnabled = this.session.getPlanModeState?.()?.enabled ?? false;
    const timeoutSeconds = this.session.settings.get("ask.timeout");
    const settingsTimeout = timeoutSeconds === 0 ? null : timeoutSeconds * 1000;
    const timeout = planModeEnabled ? null : settingsTimeout;

    this.#sendNotification();

    if (params.questions.length === 0) {
      return {
        content: [{ type: "text" as const, text: "Error: questions must not be empty" }],
        details: {},
      };
    }

    // -------------------------------------------------------------------
    // Single-question fast path
    // -------------------------------------------------------------------
    if (params.questions.length === 1) {
      const [q] = params.questions;

      const result = await handleSocraticQuestion(ui, q, signal, timeout ?? undefined);

      if (result.learnerState === "stuck" && result.selectedOptions.length === 0 && !result.customInput) {
        context.abort();
        throw new ToolAbortError("Socratic session cancelled by learner");
      }

      const coverageLine = result.coverageAfter
        ? buildCoverageLine(result.coverageAfter)
        : undefined;

      const responseParts: string[] = [];
      if (result.selectedOptions.length > 0) {
        responseParts.push(`Learner selected: ${result.selectedOptions[0]}`);
      }
      if (result.customInput !== undefined) {
        responseParts.push(`Learner's own words: "${result.customInput}"`);
      }
      if (result.verbatimQuote) {
        responseParts.push(`Verbatim quote for note: "${result.verbatimQuote}"`);
      }
      if (coverageLine) {
        responseParts.push(coverageLine);
      }
      if (result.suggestedLinksAcknowledged?.length) {
        const links = result.suggestedLinksAcknowledged
          .map(l => `${l.conceptName} (${l.relationshipType})`)
          .join(", ");
        responseParts.push(`Links acknowledged: ${links}`);
      }
      responseParts.push(`Learner state: ${result.learnerState}`);
      responseParts.push(`Hint was shown: ${result.hintWasShown}`);
      responseParts.push(`Narrowing attempt: ${result.narrowingAttemptUsed}`);

      const details: SocraticAskToolDetails = {
        question: q.question,
        options: result.options,
        multi: q.multi ?? false,
        selectedOptions: result.selectedOptions,
        customInput: result.customInput,
        questionType: q.questionType,
        learnerState: result.learnerState,
        hintWasShown: result.hintWasShown,
        coverageLine,
      };

      return {
        content: [{ type: "text" as const, text: responseParts.join("\n") }],
        details,
      };
    }

    // -------------------------------------------------------------------
    // Multi-question batch (e.g. initialization or link-acknowledgement)
    // -------------------------------------------------------------------
    const results: SocraticQuestionResult[] = [];
    for (const q of params.questions) {
      const result = await handleSocraticQuestion(ui, q, signal, timeout ?? undefined);
      results.push(result);
      if (result.learnerState === "stuck" && result.selectedOptions.length === 0 && !result.customInput) {
        // Cancelled mid-batch — abort
        context.abort();
        throw new ToolAbortError("Socratic session cancelled by learner");
      }
    }

    const responseLines = results.map(r => {
      if (r.customInput !== undefined) return `${r.id}: "${r.customInput}" [${r.questionType}|${r.learnerState}]`;
      if (r.selectedOptions.length > 0) return `${r.id}: ${r.selectedOptions[0]} [${r.questionType}|${r.learnerState}]`;
      return `${r.id}: (no answer) [${r.questionType}|stuck]`;
    });

    const lastCoverage = results.findLast(r => r.coverageAfter)?.coverageAfter;
    if (lastCoverage) responseLines.push(buildCoverageLine(lastCoverage));

    return {
      content: [{ type: "text" as const, text: `Learner answers:\n${responseLines.join("\n")}` }],
      details: { results },
    };
  }
}

// =============================================================================
// TUI Renderer
// =============================================================================

/** Question-type badge colours (using theme accent palette) */
function questionTypeBadge(type: QuestionType, uiTheme: Theme): string {
  const BADGES: Record<QuestionType, string> = {
    activation:   "⚡",
    definition:   "📖",
    mechanism:    "⚙️",
    contrast:     "⚖️",
    application:  "🔧",
    synthesis:    "🔗",
    challenge:    "🎯",
  };
  const emoji = BADGES[type] ?? "❓";
  return uiTheme.fg("muted", `${emoji} ${type}`);
}

function learnerStateBadge(state: LearnerState, uiTheme: Theme): string {
  const MAP: Record<LearnerState, string> = {
    confident:  uiTheme.fg("success", "✓ confident"),
    exploring:  uiTheme.fg("accent",  "~ exploring"),
    stuck:      uiTheme.fg("warning", "⚠ stuck"),
    frustrated: uiTheme.fg("error",   "✗ frustrated"),
  };
  return MAP[state] ?? state;
}

export const socraticAskToolRenderer = {
  /** Render the outgoing question (call side) */
  renderCall(
    args: Partial<SocraticAskToolInput>,
    _options: RenderResultOptions,
    uiTheme: Theme,
  ): Component {
    const label = formatTitle("Socratic Ask", uiTheme);
    const mdTheme = getMarkdownTheme();
    const accentStyle = { color: (t: string) => uiTheme.fg("accent", t) };
    const questions = args.questions ?? [];

    if (questions.length === 0) {
      return new Text(formatErrorMessage("No questions provided", uiTheme), 0, 0);
    }

    const container = new Container();
    const meta: string[] = [];
    if (questions.length > 1) meta.push(`${questions.length} questions`);
    container.addChild(new Text(`${label}${formatMeta(meta, uiTheme)}`, 0, 0));

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const isLast = i === questions.length - 1;
      const branch = isLast ? uiTheme.tree.last : uiTheme.tree.branch;
      const continuation = isLast ? " " : uiTheme.tree.vertical;

      // Header row: branch + question-type badge + concept ID
      const headerParts: string[] = [
        ` ${uiTheme.fg("dim", branch)} ${questionTypeBadge(q.questionType, uiTheme)}`,
      ];
      if (q.conceptId) headerParts.push(uiTheme.fg("dim", `[${q.conceptId}]`));
      if (q.narrowingAttempt) {
        headerParts.push(
          uiTheme.fg(
            q.narrowingAttempt >= NARROWING_MAX ? "warning" : "muted",
            `attempt ${q.narrowingAttempt + 1}/${NARROWING_MAX + 1}`,
          ),
        );
      }
      container.addChild(new Text(headerParts.join(" "), 0, 0));

      // Question text
      container.addChild(new Markdown(q.question, 3, 0, mdTheme, accentStyle));

      // Options list
      if (q.options.length > 0) {
        let optText = "";
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          const isLastOpt = j === q.options.length - 1;
          const optBranch = isLastOpt ? uiTheme.tree.last : uiTheme.tree.branch;
          const optLabel = renderInlineMarkdown(
            opt.label,
            mdTheme,
            t => uiTheme.fg("muted", t),
          );
          optText +=
            `\n ${uiTheme.fg("dim", continuation)}  ${uiTheme.fg("dim", optBranch)} ` +
            `${uiTheme.fg("dim", uiTheme.checkbox.unchecked)} ${optLabel}`;
        }
        container.addChild(new Text(optText, 0, 0));
      }

      // Coverage snapshot preview
      if (q.coverage) {
        const line = buildCoverageLine(q.coverage as CoverageSnapshot);
        container.addChild(
          new Text(
            `\n ${uiTheme.fg("dim", continuation)}  ${uiTheme.fg("dim", line)}`,
            0, 0,
          ),
        );
      }
    }

    return container;
  },

  /** Render the learner's answer (result side) */
  renderResult(
    result: {
      content: Array<{ type: string; text?: string }>;
      details?: SocraticAskToolDetails;
    },
    _options: RenderResultOptions,
    uiTheme: Theme,
  ): Component {
    const { details } = result;
    const mdTheme = getMarkdownTheme();
    const accentStyle = { color: (t: string) => uiTheme.fg("accent", t) };

    if (!details) {
      const txt = result.content[0];
      const fallback = txt?.type === "text" && txt.text ? txt.text : "";
      return new Text(
        `${renderStatusLine({ icon: "warning", title: "Socratic Ask" }, uiTheme)}\n${uiTheme.fg("dim", fallback)}`,
        0, 0,
      );
    }

    // ------------------------------------------------------------------
    // Multi-result
    // ------------------------------------------------------------------
    if (details.results && details.results.length > 0) {
      const header = renderStatusLine(
        {
          icon: "success",
          title: "Socratic Ask",
          meta: [`${details.results.length} questions`],
        },
        uiTheme,
      );
      const container = new Container();
      container.addChild(new Text(header, 0, 0));

      for (let i = 0; i < details.results.length; i++) {
        const r = details.results[i];
        const isLast = i === details.results.length - 1;
        const branch = isLast ? uiTheme.tree.last : uiTheme.tree.branch;
        const continuation = isLast ? "   " : `${uiTheme.fg("dim", uiTheme.tree.vertical)}  `;

        container.addChild(
          new Text(
            ` ${uiTheme.fg("dim", branch)} ${questionTypeBadge(r.questionType, uiTheme)} ` +
            `${learnerStateBadge(r.learnerState, uiTheme)}` +
            (r.hintWasShown ? `  ${uiTheme.fg("warning", "💡 hint shown")}` : ""),
            0, 0,
          ),
        );
        container.addChild(new Markdown(r.question, 3, 0, mdTheme, accentStyle));

        if (r.selectedOptions.length > 0) {
          const selectedLabel = renderInlineMarkdown(
            r.selectedOptions[0],
            mdTheme,
            t => uiTheme.fg("toolOutput", t),
          );
          container.addChild(
            new Text(
              `${continuation}${uiTheme.fg("dim", uiTheme.tree.last)} ` +
              `${uiTheme.fg("success", uiTheme.checkbox.checked)} ${selectedLabel}`,
              0, 0,
            ),
          );
        }
        if (r.customInput !== undefined) {
          const lines = r.customInput.split("\n");
          const firstLine = uiTheme.fg("toolOutput", lines[0] ?? "");
          let text =
            `\n${continuation}${uiTheme.fg("dim", uiTheme.tree.last)} ` +
            `${uiTheme.styledSymbol("status.success", "success")} ${firstLine}`;
          for (let j = 1; j < lines.length; j++) {
            text += `\n${continuation}   ${uiTheme.fg("toolOutput", lines[j])}`;
          }
          container.addChild(new Text(text, 0, 0));
        }
        if (r.coverageAfter) {
          container.addChild(
            new Text(
              `\n${continuation}${uiTheme.fg("dim", buildCoverageLine(r.coverageAfter))}`,
              0, 0,
            ),
          );
        }
      }
      return container;
    }

    // ------------------------------------------------------------------
    // Single-question result
    // ------------------------------------------------------------------
    if (!details.question) {
      const txt = result.content[0];
      return new Text(txt?.type === "text" && txt.text ? txt.text : "", 0, 0);
    }

    const hasAnswer =
      details.customInput !== undefined ||
      (details.selectedOptions && details.selectedOptions.length > 0);

    const header = renderStatusLine(
      { icon: hasAnswer ? "success" : "warning", title: "Socratic Ask" },
      uiTheme,
    );
    const container = new Container();
    container.addChild(new Text(header, 0, 0));

    // Question type + learner state line
    const typeState: string[] = [];
    if (details.questionType) typeState.push(questionTypeBadge(details.questionType, uiTheme));
    if (details.learnerState) typeState.push(learnerStateBadge(details.learnerState, uiTheme));
    if (details.hintWasShown) typeState.push(uiTheme.fg("warning", "💡 hint shown"));
    if (typeState.length > 0) {
      container.addChild(new Text(` ${typeState.join("  ")}`, 0, 0));
    }

    container.addChild(new Markdown(details.question, 1, 0, mdTheme, accentStyle));

    if (details.selectedOptions && details.selectedOptions.length > 0) {
      const selectedLabel = renderInlineMarkdown(
        details.selectedOptions[0],
        mdTheme,
        t => uiTheme.fg("toolOutput", t),
      );
      container.addChild(
        new Text(
          ` ${uiTheme.fg("dim", uiTheme.tree.last)} ` +
          `${uiTheme.fg("success", uiTheme.checkbox.checked)} ${selectedLabel}`,
          0, 0,
        ),
      );
    }

    if (details.customInput !== undefined) {
      const lines = details.customInput.split("\n");
      const firstLine = uiTheme.fg("toolOutput", lines[0] ?? "");
      let text =
        `\n ${uiTheme.fg("dim", uiTheme.tree.last)} ` +
        `${uiTheme.styledSymbol("status.success", "success")} ${firstLine}`;
      for (let j = 1; j < lines.length; j++) {
        text += `\n    ${uiTheme.fg("toolOutput", lines[j])}`;
      }
      container.addChild(new Text(text, 0, 0));
    }

    if (details.coverageLine) {
      container.addChild(
        new Text(
          `\n ${uiTheme.fg("dim", uiTheme.tree.last)} ${uiTheme.fg("dim", details.coverageLine)}`,
          0, 0,
        ),
      );
    }

    return container;
  },
};
