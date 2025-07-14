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
```

## Key Features

- **Socratic Method**: Guides through questions, not answers
- **Problem-Solving Plan Mode**: Helps break down complex challenges into manageable MVP-first strategies
- **Language Agnostic**: Works with any programming language
- **Persistent Memory**: Remembers your learning journey across sessions
- **Adaptive Teaching**: Adjusts approach based on your learning style
- **Safe Learning Environment**: Encourages exploration and mistakes

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/socratic-coding-tutor.git
   cd socratic-coding-tutor
   ```

2. **Add your coding exercises:**
   - Copy your project files or exercises into the workspace
   - The tutor will work with any existing codebase or new projects

3. **Start learning:**
   - Open the workspace in VS Code with GitHub Copilot enabled
   - **First time users**: Begin asking questions about your code or concepts
   - **Returning users**: Start with "read my memory bank" or "update" to restore context from previous sessions

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
