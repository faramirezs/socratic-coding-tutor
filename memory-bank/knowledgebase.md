<!-- Memory Bank File: Programming Concepts Knowledge Base -->
<!-- Purpose: Repository of programming concepts with Socratic questioning strategies -->
<!-- Update Frequency: When new concepts are needed or question strategies are refined -->
<!-- Cross-references: ←common-student-issues.md (error patterns), ←progress.md (student mastery) -->

# Programming Concepts Knowledge Base

## How to Use This File:
- Add new concepts as needed during tutoring
- Reference concept-specific questions during sessions
- Use analogies to help explain abstract concepts
- Keep code snippets simple and illustrative

---

## Template for Adding New Concepts:

### Concept: [Concept Name]

**Core Explanation (For Tutor's Understanding):**
- [Concise definition of the concept]
- [Key properties and behaviors]
- [When and why this concept is used]

**Helpful Analogies:**
- [Real-world analogy that helps explain the concept]
- [Alternative analogy for different learning styles]

**Key Socratic Questions for This Concept:**
- "What problem does [concept] typically solve?"
- "What are the essential parts of a [concept]?"
- "How does [concept] differ from [related_concept]?"
- "Can you think of a situation where using [concept] would be beneficial/detrimental?"
- "What happens if we remove/change [specific part] of this [concept]?"

**Common Student Misconceptions:**
- [Typical misunderstanding students have]
- [Another common confusion point]

**Diagnostic Questions for Misconceptions:**
- "What do you think [specific part] does here?"
- "How would you explain [concept] to someone who's never seen it before?"

**Simple Illustrative Code Snippets (For Tutor Reference Only):**
```[language]
// Basic example showing the concept
[simple code example]
```

```[language]
// Common mistake or edge case
[example of common error]
```

**Prerequisites:** [What concepts student should understand first]
**Leads to:** [What concepts this enables understanding of next]

---

## Example Concept Entry:

### Concept: Variables

**Core Explanation (For Tutor's Understanding):**
- Named storage locations that hold values
- Values can be changed (mutable) or fixed (immutable)
- Have scope (where they can be accessed) and lifetime

**Helpful Analogies:**
- Labeled boxes where you can store and retrieve items
- Name tags that point to specific values in memory

**Key Socratic Questions for This Concept:**
- "What problem do variables solve in programming?"
- "What happens when you try to use a variable before giving it a value?"
- "How is creating a variable different from using a variable?"
- "Why might you want to change a variable's value?"

**Common Student Misconceptions:**
- Thinking the variable "is" the value rather than "holds" the value
- Confusion about when variables are created vs when they're used

**Diagnostic Questions for Misconceptions:**
- "What do you think happens in memory when you create a variable?"
- "If I change this variable here, what happens to other places that use it?"

**Simple Illustrative Code Snippets (For Tutor Reference Only):**
```python
# Basic variable usage
name = "Alice"
age = 25
```

```python
# Common mistake - using before defining
print(greeting)  # NameError
greeting = "Hello"
```

**Prerequisites:** Basic understanding of data types
**Leads to:** Functions, scope, data structures

---

## Problem-Solving Concept Templates:

### Concept: Problem Decomposition

**Core Explanation (For Tutor's Understanding):**
- Breaking complex problems into smaller, manageable subproblems
- Identifying core requirements vs. nice-to-have features
- Creating logical dependency chains between problem components

**Helpful Analogies:**
- Like organizing a messy room: start with big categories, then sort within each category
- Building with LEGO: start with foundation pieces, then add complexity layer by layer

**Key Socratic Questions for This Concept:**
- "What's the simplest version of this problem that would still be useful?"
- "If you could only implement one feature, which would provide the most value?"
- "What are the core building blocks this problem needs?"
- "Which parts of this problem do you already know how to solve?"

**Common Student Misconceptions:**
- Trying to solve everything at once instead of prioritizing
- Not identifying the MVP (Minimum Viable Product) before starting

**Prerequisites:** None (foundational skill)
**Leads to:** MVP strategy, iteration planning, knowledge gap identification

### Concept: Knowledge Gap Identification

**Core Explanation (For Tutor's Understanding):**
- Recognizing what you know vs. what you need to learn
- Distinguishing between "I don't know this at all" vs. "I'm fuzzy on this"
- Prioritizing learning based on problem-solving needs

**Helpful Analogies:**
- Like a map with known territories and unexplored areas
- Building a puzzle: identifying which pieces you have vs. which you need to find

**Key Socratic Questions for This Concept:**
- "What parts of this problem feel familiar to you?"
- "Where do you feel confident vs. uncertain?"
- "What specific thing do you need to learn to move forward?"
- "If you had to rank your knowledge of each part from 1-10, what would it look like?"

**Prerequisites:** Problem decomposition
**Leads to:** Learning path creation, concept mastery planning

---

*Add new concepts below following the template structure above.*

**Cross-References:**
- **← tutoring-insights.md**: Sources proven questioning strategies and successful analogies
- **→ common-student-issues.md**: Links concept misconceptions to diagnostic approaches
- **← progress.md**: Reference student's current concept mastery level when selecting questions
- **→ active-session.md**: Provides concept-specific Socratic questions for current tutoring focus
- **→ plan.md**: Inform concept prerequisites and dependencies for problem-solving plan creation
- **→ instructions/plan-mode-instructions.md**: Problem-solving concepts support plan mode questioning strategies
