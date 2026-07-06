---
title: 'Prompting Is Task Design, Not Spell Casting'
description: 'Better prompts do not come from clever wording. They come from clearer goals, materials, constraints, formats, and checks.'
date: 2026-07-06
lang: en
tags: ['Prompt', 'AI workflow']
series: 'AI Research Efficiency 101'
readingTime: 8
audience: 'teacher'
---

“Help me write a literature review.”

That is the first prompt many people try. The answer often looks fluent, but it is rarely ready to use.

The problem is not only the model. The task is underdesigned.

## Five parts of a useful prompt

A research prompt becomes useful when it includes five parts:

| Part       | Question                              |
| ---------- | ------------------------------------- |
| Goal       | What should the output achieve?       |
| Material   | What information may the model use?   |
| Constraint | What limits must it respect?          |
| Format     | What shape should the answer take?    |
| Check      | How will I know whether it is usable? |

If one part is missing, the model fills the gap by guessing.

## A better abstract revision prompt

Instead of writing:

> Improve this abstract.

Write:

```text
Task: Revise this abstract for a chemistry research paper.
Goal: Make the practical contribution clearer.
Material: Use only the abstract below. Do not invent results.
Constraints:
- Keep it under 150 words.
- Preserve the catalyst name, characterization methods, and main finding.
- Avoid exaggerated claims.
Format: Return one revised paragraph and a three-bullet change log.
Check: Mark any sentence that needs confirmation from the original data.
```

This is not just a better prompt. It is a better task.

## The real skill

Prompt engineering is not memorizing templates.

The real skill is turning a vague request into a task that can be executed, inspected, and improved.

When you can do that, AI becomes less mysterious and much more useful.

---

_This is article 2 in the “AI Research Efficiency 101” series._
