# Socratic Coding Tutor

A GitHub Copilot-powered AI tutor that teaches programming concepts using the Socratic method - guiding students to discover solutions through thoughtful questions rather than providing direct answers.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/faramirezs/socratic-coding-tutor)

## Overview

The Socratic Coding Tutor helps students develop deep understanding and independent problem-solving skills across various programming languages. Instead of giving immediate solutions, it asks guided questions that lead students to their own discoveries.

## Project Structure

```
.github/
├── copilot-instructions.md     # Core AI tutor identity and behavior
└── prompts/
    └── memory-bank-prompt.md   # Memory system workflows and operations

memory-bank/                    # Persistent learning context
├── active-session.md          # Current conversation state
├── student-profile.md         # Learning style and preferences
├── progress.md                # Learning journey and mastery
├── tutoring-insights.md       # Effective teaching strategies
├── knowledgebase.md           # Programming concepts with questions
└── common-student-issues.md   # Error patterns and diagnostics
```

## Key Features

- **Socratic Method**: Guides through questions, not answers
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

### Agent Mode (For Memory Management)
Use when you need to manage the tutor's memory system or perform administrative tasks.

**Examples:**
- "update" - Save current session insights to memory bank
- "update active-session" - Update specific memory bank files
- "update session-end" - End-of-session memory update

**What the tutor does:**
- Performs memory bank operations and file management
- Updates learning context and progress tracking
- Maintains persistent knowledge across sessions

## Memory System

The tutor maintains context through the Memory Bank system:

### Manual Memory Updates
- Say `update` to save current session insights
- Say `update active-session` to update specific files
- Say `update session-end` when finishing a learning session

### Automatic Context
The tutor automatically reads your learning history at the start of each session to provide personalized guidance.

## Best Practices

1. **Be Specific**: Ask about particular code sections or concepts
2. **Engage with Questions**: Try to answer the tutor's questions before asking for hints
3. **Experiment**: Test the tutor's suggestions in your code
4. **Reflect**: Explain your understanding in your own words
5. **Update Memory**: Use `update` after significant learning breakthroughs

## Example Learning Session

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
