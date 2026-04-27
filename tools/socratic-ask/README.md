# `socratic-ask` Tool

A Socratic extension of the base `ask` tool, purpose-built for the [Zettelkasten Socratic Tutor skill](../../skills/zettelkasten-socratic-tutor/SKILL.md).

## What it adds over `ask`

| Feature | Base `ask` | `socratic-ask` |
|---|---|---|
| Question-type tagging | ✗ | ✅ 7 types (activation → challenge) |
| Narrowing-attempt counter | ✗ | ✅ auto-escalates to hint at 3 misses |
| Hint injection | ✗ | ✅ `hintText` shown when `narrowingAttempt ≥ 3` |
| Learner-state inference | ✗ | ✅ confident / exploring / stuck / frustrated |
| Coverage metrics line | ✗ | ✅ displayed after every answer |
| Verbatim quote capture | ✗ | ✅ routes to atomic note verbatim field |
| Concept-link follow-up | ✗ | ✅ surfaces `suggestedLinks` after own-words answers |
| Base `ask` compatibility | ✅ | ✅ all base fields preserved |

## Schema additions

```typescript
// All base `ask` fields are inherited unchanged.
// These are the Socratic-only additions per question:

questionType:
  'activation' | 'definition' | 'mechanism' |
  'contrast'   | 'application'| 'synthesis' | 'challenge'

conceptId?:         string   // maps to target-docs/_index.md concept ID
narrowingAttempt?:  number   // 0-based; hint injected when ≥ 3
hintText?:          string   // minimum scaffolding — never the full answer
coverage?:          CoverageSnapshot
suggestedLinks?:    ConceptLinkSuggestion[]
```

## Usage example

```typescript
await socraticAsk({
  questions: [
    {
      id: "q-definition-c01",
      question: "How would you describe a Zettelkasten note in your own words?",
      questionType: "definition",
      conceptId: "C01",
      options: [
        { label: "An atomic unit of knowledge linked to others", conceptId: "C01" },
        { label: "A summary of a document", conceptId: "C01" },
        { label: "A flashcard for spaced repetition", conceptId: "C01" },
      ],
      recommended: 0,
      narrowingAttempt: 0,
      hintText: "Think about what makes it \"atomic\" — what does one note contain?",
      coverage: {
        covered: 2,
        partial: 1,
        total: 30,
        sessionMinutes: 4.5,
      },
    },
  ],
});
```

## Narrowing state machine

```
Attempt 0  →  Full open question
Attempt 1  →  Narrowing question ("You mentioned X — what about Y?")
Attempt 2  →  Narrowing question (edge case probe)
Attempt 3  →  hintText injected above the options
Attempt 4+ →  Still with hint; agent considers partial credit (0.5)
```

## Coverage line format

Displayed after every answer when `coverage` is provided:

```
📊 Coverage: 23% (7/30 concepts) | Velocity: 2.3%/min | Est. to 100%: 33 min
```

## Learner state mapping

| State | Trigger | Agent action |
|---|---|---|
| `confident` | Selected an anchor option | Affirm + next concept |
| `exploring` | Typed own-words answer | Narrow or probe deeper |
| `stuck` | No answer / cancelled | Offer hint or simplify |
| `frustrated` | Explicit flag or 3× stuck | Acknowledge + simplest sub-question |
