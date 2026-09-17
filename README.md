# Socratic Coding Tutor

A GitHub Copilot-powered AI tutor that teaches programming concepts using the Socratic method - guiding students to discover solutions through thoughtful questions rather than providing direct answers.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/faramirezs/socratic-coding-tutor)

## Overview

The Socratic Coding Tutor helps students develop deep understanding and independent problem-solving skills across various programming languages. Instead of giving immediate solutions, it asks guided questions that lead students to their own discoveries.

## Project Structure

```
instructions/
├── copilot-instructions.md        # Core AI tutor identity and behavior
├── plan-mode-instructions.md      # Problem-solving plan mode behavior (NEW)
└── prompts/
    └── memory-bank-prompt.md      # Memory system workflows and operations

memory-bank/                       # Persistent learning context
├── active-session.md             # Current conversation state
├── student-profile.md            # Learning style and preferences
├── progress.md                   # Learning journey and mastery
├── plan.md                       # Problem-solving plans and strategies (NEW)
├── tutoring-insights.md          # Effective teaching strategies
├── knowledgebase.md              # Programming concepts with questions
└── common-student-issues.md      # Error patterns and diagnostics

skills/                            # Agent skills (name + description front matter)
├── coderpad/                     # Drive CoderPad Screen IDE in a shared browser
└── zettelkasten-socratic-tutor/  # Socratic dialogue that produces atomic notes

tools/
└── socratic-ask/                 # Socratic extension of the base ask tool
    ├── README.md                 # Schema, narrowing ladder, coverage line format
    └── socratic-ask.ts           # Tool source
```

## Key Features

- **Socratic Method**: Guides through questions, not answers
- **Problem-Solving Plan Mode**: Helps break down complex challenges into manageable MVP-first strategies
- **Language Agnostic**: Works with any programming language
- **Persistent Memory**: Remembers your learning journey across sessions
- **Adaptive Teaching**: Adjusts approach based on your learning style
- **Safe Learning Environment**: Encourages exploration and mistakes

## Prerequisites

What the tutor needs from your client:

- **GitHub Copilot with Copilot Chat.** The project is "a GitHub Copilot-powered AI tutor", and the setup step is to open the workspace in VS Code with GitHub Copilot enabled.
- **Copilot Agent Mode.** The memory update commands (`update`, `update plan`, `update session-end`) are documented under Agent Mode, so the client must provide it. Agent Mode comes with a Copilot plan that includes it; this repository does not name a specific plan or license tier.
- **VS Code.** It is the only client named in this repository, in the setup step below and in the workspace wording used throughout.
- **Instruction file support.** The tutor identity and behavior live in [`instructions/copilot-instructions.md`](instructions/copilot-instructions.md), and plan mode behavior lives in [`instructions/plan-mode-instructions.md`](instructions/plan-mode-instructions.md). Your client must load those files as custom instructions; this repository does not state the exact setting path for any client.
- **Skill file support.** The two skills are [`skills/zettelkasten-socratic-tutor/SKILL.md`](skills/zettelkasten-socratic-tutor/SKILL.md) and [`skills/coderpad/SKILL.md`](skills/coderpad/SKILL.md). Both declare `name` and `description` front matter, so the client must discover skills from that folder layout.

No API keys, environment file or external service are needed for the tutor itself: the repository ships none, and the tutor runs inside the client.

Two optional extras:

- The `coderpad` skill additionally needs the `chrome-agent` CLI, a headed Chrome on your own machine with an isolated profile, and a reverse SSH tunnel. See [`skills/coderpad/SKILL.md`](skills/coderpad/SKILL.md).
- The `socratic-ask` tool additionally needs a harness that loads TypeScript agent tools (`@oh-my-pi/pi-agent-core`). See [Example: One Tutor Exchange](#example-one-tutor-exchange).

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/faramirezs/socratic-coding-tutor.git
   cd socratic-coding-tutor
   ```

2. **Add your coding exercises:**
   - Copy your project files or exercises into the workspace
   - The tutor will work with any existing codebase or new projects

3. **Start learning:**
   - Open the workspace in VS Code with GitHub Copilot enabled
   - **First time users**: Begin asking questions about your code or concepts
   - **Returning users**: Start with "read my memory bank" or "update" to restore context from previous sessions

## Example: One Tutor Exchange

The shortest exchange to reproduce uses one `definition` question through the `socratic-ask` tool. There is no shell command and no learner-typed call: `socratic-ask` is an agent tool, so the agent makes the call under the hood and the learner only answers the prompt. Field names, badges and the coverage line come from [`tools/socratic-ask/socratic-ask.ts`](tools/socratic-ask/socratic-ask.ts); the worked call is the usage example in [`tools/socratic-ask/README.md`](tools/socratic-ask/README.md). That file imports the harness it plugs into (`@oh-my-pi/pi-agent-core`, `../tui`) and this repository ships no `package.json`, so a clone alone cannot run the call. The steps below document the exchange; the [Reproduce it](#reproduce-it) recipe gives the part you can run today.

### Step 1: The agent calls the tool

```typescript
await socraticAsk({
  questions: [
    {
      id: "q-definition-c01",
      question: "How would you describe a Zettelkasten note in your own words?",
      questionType: "definition",   // activation | definition | mechanism | contrast |
                                    // application | synthesis | challenge
      conceptId: "C01",             // concept ID from target-docs/_index.md
      options: [
        { label: "An atomic unit of knowledge linked to others", conceptId: "C01" },
        { label: "A summary of a document", conceptId: "C01" },
        { label: "A flashcard for spaced repetition", conceptId: "C01" },
      ],
      recommended: 0,               // index of the most-expected anchor
      narrowingAttempt: 0,          // the hint is injected once this reaches 3
      hintText: "What does one note contain, and what makes it atomic?",
      coverage: { covered: 2, partial: 1, total: 30, sessionMinutes: 4.5 },
    },
  ],
});
```

Anchors are response anchors, not answers. The learner picks one or picks `Other (type your own)` and writes the answer in their own words.

### Step 2: What the learner sees (trimmed reconstruction of the tool's renderer output, not a live capture)

```text
Socratic Ask
 📖 definition  ✓ confident
 How would you describe a Zettelkasten note in your own words?
 └ ✓ An atomic unit of knowledge linked to others
 📊 Coverage: 8% (2/30 concepts) | Velocity: 1.8%/min | Est. to 100%: 51 min
```

### Step 3: What the agent receives (trimmed reconstruction, not a live capture)

```text
Learner selected: An atomic unit of knowledge linked to others
📊 Coverage: 8% (2/30 concepts) | Velocity: 1.8%/min | Est. to 100%: 51 min
Learner state: confident
Hint was shown: false
Narrowing attempt: 0
```

The coverage numbers follow the snapshot above: 2 fully covered concepts plus 0.5 for the partial one, out of 30, rounds to 8%, and 8% over 4.5 minutes is 1.8%/min. Selecting a known anchor reports `confident`; typing an own-words answer reports `exploring` and captures that text as a verbatim quote for the atomic note.

### Reproduce it

1. If you have a client that loads TypeScript agent tools (see [Prerequisites](#prerequisites)), make the call above. This repository alone cannot run it: the tool file imports its host harness and there is no `package.json` here. The tool also needs an interactive UI and returns nothing without one.
2. Call it again with `narrowingAttempt: 3` and a `hintText`: the question then renders with a 💡 Hint block above the options, as the narrowing ladder in the tool README describes.
3. The runnable path today is conversational. Open the workspace in VS Code, turn on GitHub Copilot, say `read my memory bank`, then ask about your own code or a concept you want to understand. The transcripts under [Example Learning Sessions](#example-learning-sessions) show the expected tutor behaviour.

## Session Management

### Starting a New Session
- **First-time users**: Jump right into asking questions
- **Returning learners**: Begin with "read my memory bank" to restore your learning context
- **After breaks**: Use "update" to refresh the tutor's understanding of your current progress

## Usage Modes

### Ask Mode (Recommended for Learning)
Use when you want to understand concepts or debug issues through guided discovery.

**Examples:**
- "I'm having trouble with this function, can you help me understand what's wrong?"
- "I don't understand how pointers work in this context"
- "Why isn't my loop working as expected?"

**What the tutor does:**
- Asks diagnostic questions to identify knowledge gaps
- Guides you to test hypotheses with small code experiments
- Helps you connect new concepts to what you already know
- Encourages you to articulate your understanding

### Plan Mode (For Complex Problems)
Use when facing complex, multi-step coding challenges that feel overwhelming.

**Plan Mode Activation Triggers:**
- "I don't know where to start"
- "This seems too complex"
- "Help me make a plan"
- "How do I approach this problem?"

**Examples:**
- "I need to build a web scraper but I've never done this before"
- "I have to implement a binary search tree and don't know where to begin"
- "This shell project seems overwhelming - where should I start?"

**What the tutor does:**
- Breaks down complex problems into manageable pieces
- Identifies what you already know vs. what you need to learn
- Helps you define the smallest working version (MVP)
- Creates step-by-step plans in your own words
- Guides you from planning to implementation

### Agent Mode (For Memory Management)
Use when you need to manage the tutor's memory system or perform administrative tasks.

**Examples:**
- "update" - Save current session insights to memory bank
- "update active-session" - Update specific memory bank files
- "update plan" - Update your current problem-solving plan
- "update session-end" - End-of-session memory update

**What the tutor does:**
- Performs memory bank operations and file management
- Updates learning context and progress tracking
- Maintains persistent knowledge across sessions
- Tracks problem-solving plan progress

## Memory System

The tutor maintains context through the Memory Bank system:

### Manual Memory Updates
- Say `update` to save current session insights
- Say `update active-session` to update specific files
- Say `update plan` to save or update your problem-solving plan
- Say `update plan-step` to mark a plan step as completed
- Say `update session-end` when finishing a learning session

### Automatic Context
The tutor automatically reads your learning history at the start of each session to provide personalized guidance.

## Memory Bank Privacy and Your Notes

The seven files in `memory-bank/` ship as templates and worked examples, not as learner data:

- The four student-data files (`student-profile.md`, `progress.md`, `active-session.md`, `plan.md`) hold placeholder fields only: bracketed prompts such as `[e.g., User123, or leave blank if anonymous]` and sample lines such as `(e.g., Explained polymorphism accurately - 2025-06-04)`. The sample dates (`2025-06-04`) and the sample identifier (`User123`) are illustrative.
- Two files hold reusable tutor-facing reference content, not any person's record: `tutoring-insights.md` lists general questioning strategies and analogies, and `knowledgebase.md` holds concept templates plus one worked `Variables` entry whose two-line snippet reads `name = "Alice"` and `age = 25`. Those are fictional teaching strings, not a learner record.
- `common-student-issues.md` is a template with an empty catalog, ready for new entries.
- The files are meant to hold your own notes: your learning goals, your progress, your plans and your current session context, in your own words.
- Anything written there is plain text in your own working copy or your own repository. Nothing else reads it unless you share it.
- This repository ships no real learner data: no learner names, contact details, credentials or session history. Every identifier and date in the memory bank is a placeholder or an example.
- The tutor reads the memory bank at the start of an interaction and writes to it only after you say `update`. The read rules are in [`instructions/copilot-instructions.md`](instructions/copilot-instructions.md); the write rules are in [`instructions/prompts/memory-bank-prompt.md`](instructions/prompts/memory-bank-prompt.md).
- If you commit a memory bank that you have filled in, treat it as plain text that anyone with access to that repository can read.

## Problem-Solving Plan Mode

### When to Use Plan Mode
Plan Mode is automatically activated when you:
- Say "I don't know where to start"
- Face a complex problem for the first time
- Ask "How do I approach this?"
- Express feeling overwhelmed by problem complexity
- Encounter multi-step coding challenges

### Plan Mode Process
1. **Problem Understanding**: Break down what the challenge is asking
2. **Knowledge Inventory**: Identify what you already know
3. **Gap Identification**: Recognize what you need to learn
4. **MVP Discovery**: Find the smallest working version
5. **First Step**: Define your immediate next action
6. **Iteration Planning**: Plan how to add complexity gradually

### Plan Mode Benefits
- **Reduces Overwhelm**: Complex problems become manageable pieces
- **Builds Confidence**: Recognizes your existing knowledge
- **Creates Clarity**: Provides specific, actionable next steps
- **Maintains Momentum**: Keeps you focused on implementation
- **Develops Skills**: Builds transferable problem-solving abilities

### Plan Documentation
Your plans are:
- Captured in your own words and reasoning
- Approved by you before implementation
- Stored in `memory-bank/plan.md` for reference
- Transferred to active sessions for execution
- Updated as you make progress and discoveries

## Best Practices

### General Learning
1. **Be Specific**: Ask about particular code sections or concepts
2. **Engage with Questions**: Try to answer the tutor's questions before asking for hints
3. **Experiment**: Test the tutor's suggestions in your code
4. **Reflect**: Explain your understanding in your own words
5. **Update Memory**: Use `update` after significant learning breakthroughs

### Problem-Solving (Plan Mode)
1. **Start with MVP**: Always identify the smallest working version first
2. **Break Down Complexity**: Don't try to solve everything at once
3. **Use Your Own Words**: Ensure plans are documented in your language and reasoning
4. **Approve Your Plan**: Only proceed when you feel ownership of the strategy
5. **Iterate and Adjust**: Plans can evolve as you learn through implementation
6. **Stay Action-Oriented**: Transition from planning to coding quickly to maintain momentum

## Example Learning Sessions

### Regular Tutoring Session

```
Student: "My recursive function isn't working. It's supposed to calculate factorial."

Tutor: "I see you're working with recursion. Before we look at the code,
what do you think are the two essential components every recursive
function needs?"

Student: "A base case and... calling itself?"

Tutor: "Exactly! Now, looking at your function, can you identify
where you've implemented each of these components?"

[Student examines code and discovers missing base case]

Student: "Oh! I don't have a proper base case for when n equals 0 or 1."

Tutor: "Great discovery! What do you think should happen when n is 0 or 1
in a factorial calculation?"
```

### Plan Mode Session

```
Student: "I need to build a simple shell in C, but I have no idea where to start. This seems overwhelming."

Tutor: "I hear that this feels overwhelming. Let's break it down together.
First, in your own words, what do you think a shell needs to do at its most basic level?"

Student: "It needs to... take commands from the user and run them?"

Tutor: "Perfect! That's exactly the core function. Now, what's the smallest possible
version of that you could imagine building?"

Student: "Maybe... just read one command and try to run it?"

Tutor: "Excellent! That's your MVP. What would you need to know to build just that tiny version?"

Student: "I'd need to know how to read input from the user, and how to run a command..."

Tutor: "Great! So you've identified two specific things to learn. Which one feels
like the better starting point?"

Student: "Probably reading input first?"

Tutor: "Smart choice! Does this capture your plan accurately: Start with a program
that just reads and prints user input, then add command execution with system()?"

Student: "Yes, that feels manageable!"

[Plan is documented and transferred to active session for implementation]
```

## CoderPad Agent Skill (`skills/coderpad`)

This skill lets an AI agent drive [CoderPad Screen IDE](https://coderpad.io) as a trusted human-speed user inside a browser window you can watch. It was built and battle-tested on a CoderPad tutorial plus a 3-question Python test (all green). Full agent instructions live in [`skills/coderpad/SKILL.md`](skills/coderpad/SKILL.md).

Browser control is powered by [captivus/chrome-agent](https://github.com/captivus/chrome-agent), a CLI that speaks the Chrome DevTools Protocol (CDP) with no abstraction layer. Every browser action below is a `chrome-agent` one-shot command or `attach` session.

### What we do

- The agent observes the CoderPad exercise (timer, instructions, tests, editor stub), solves it locally, types the fix into the Monaco editor at human speed, runs all tests, and reports. It never presses Submit unasked.
- Tutorial exercises are fair game (repeatable, unscored). Live assessments are observe-only unless you explicitly order each write and own the consequences.

### How it works (architecture)

```text
Mac (you)                              Linux VPS (agent)
------------------------+              +---------------------------+
| Headed Chrome          | CDP :9222   | chrome-agent -> localhost |
| user-data-dir isolated |<--tunnel-->| registry mac-shared-01    |
| You watch + veto       |  ssh -R     | observe freely, act on order|
------------------------+             +---------------------------+
```

1. **Launch (you, Mac):** headed Chrome with remote debugging and an isolated profile:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-shared --remote-allow-origins=* about:blank
   ```
2. **Tunnel (you, Mac):** map VPS port 9222 to the Mac browser. Kill switch included:
   ```bash
   ssh -R 9222:127.0.0.1:9222 USER@100.x.y.z -N -f
   pkill -f "ssh -R 9222"   # ends agent access in <1 sec
   ```
3. **Register (agent, VPS):** verify `curl http://localhost:9222/json/version`, write `/tmp/chrome-agent/registry.json` entry `mac-shared-01` with a long-lived shell PID, confirm `chrome-agent status` shows `alive:true`.
4. **Operate (agent):** one-shot CDP commands (`Runtime.evaluate`, `Input.dispatchMouseEvent`, `Input.insertText`, `Page.captureScreenshot`) addressed at `mac-shared-01`. Each gets an isolated session, so observers never disturb each other.

### Trusted-user rules

- Isolated browser profile only; your main cookies stay out of reach.
- Observe-only default. Clicks, keystrokes, and editor writes need your go-ahead per exercise (or one standing test-wide order). Submit always needs its own order.
- The agent narrates intent in chat and via `console.log('[agent] ...')` in the page.
- Every write is logged (`/tmp/agent-log/cdp.log`) with timestamp and content hash.
- Native browser signals kept clean: no fingerprint spoofing, no automation flags (`navigator.webdriver=false`, real platform/vendor).

### Human-speed interaction

- Mouse moves in 5 steps (50-150 ms apart); press and release are separate events.
- Code is typed line-by-line (`Input.insertText` per line, 300-600 ms gaps, longer at block boundaries). A 37-line fix takes ~55 s. That is the point.
- Monaco auto-indent stacks pasted indent, so a logged one-pass `executeEdits` normalization follows typing, then a read-back verify.
- Reads max 1/sec; `Run all tests` click waits 6-10 s before reading `Console output`.

### Proven runs (2026-09-04)

- **Tutorial, ant diagonal steps:** replaced `return 120` with axis tracking, `int(sqrt(x²+y²))`. Tests passed.
- **Q1, sequence join point (471, 480 → 519):** two-pointer advance of the smaller sequence. 8/8 tests passed.
- **Q2, network endpoint/loop:** `dict(zip)` map plus visited set. All tests passed.
- **Q3, wind-blown leaves grid:** excursion-envelope rectangle sum, O(cells + wind), 300/300 brute-force cross-checks, 1M-cell run in 0.22 s. All tests including `EfficiencyTest` passed. (The statement claimed example output 4 while its own trace sums to 5; the rules-based answer stands.)

### References

- Agent-browser engine: [captivus/chrome-agent](https://github.com/captivus/chrome-agent) (CDP collaboration model, isolated sessions, detection audit).
- Skill source of truth: [`skills/coderpad/SKILL.md`](skills/coderpad/SKILL.md).
