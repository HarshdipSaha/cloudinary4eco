## UI Pro Max Search Results
**Domain:** icons | **Query:** icon button accessible label
**Source:** icons.csv | **Found:** 3 results

### Result 1
- **Category:** Guideline
- **Icon Name:** icon-context-accessibility
- **Keywords:** decorative icon aria hidden, meaningful icon text alternative, icon button accessible label, accessible name, aria pressed, aria expanded, semantic context, phosphor, heroicons
- **Library:** Phosphor (primary) + Heroicons (fallback)
- **Import Code:** import { Question } from '@phosphor-icons/react'; import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
- **Usage:** Prefer the most semantically precise Phosphor icon, even if it is outside this curated subset. Use Heroicons only as a consistent fallback. Keep one visual family per surface. Context is chosen by use: if decorative beside visible text, set aria-hidden="true"; if meaningful without equivalent visibl...
- **Best For:** Contextual icon semantics, icon accessibility, and library fallback rules
- **Style:** Outline
- **Semantic Role:** guideline
- **Allowed Contexts:** decorative|meaningful|interactive

### Result 2
- **Category:** Commerce
- **Icon Name:** tag
- **Keywords:** label price discount sale
- **Library:** Phosphor
- **Import Code:** import { Tag } from '@phosphor-icons/react'
- **Usage:** <Tag size={20} weight="regular" />; Context is chosen by use: if decorative beside visible text, set aria-hidden="true"; if meaningful without equivalent visible text, provide a text alternative; if inside an interactive control, give the control an accessible name and expose applicable state (for e...
- **Best For:** Price tag label
- **Style:** Outline
- **Semantic Role:** meaningful
- **Allowed Contexts:** decorative|meaningful|interactive

### Result 3
- **Category:** Style Config
- **Icon Name:** bold-typography-icon-system
- **Keywords:** bold typography, editorial, mono label, phosphor, weight regular, minimal, icon+label required, size 20ΓÇô32
- **Library:** Phosphor (react-native)
- **Import Code:** import { ArrowRight } from 'phosphor-react-native'
- **Usage:** <ArrowRight size={20} weight="regular" color={colors.accent} />; Context is chosen by use: if decorative beside visible text, set aria-hidden="true"; if meaningful without equivalent visible text, provide a text alternative; if inside an interactive control, give the control an accessible name and e...
- **Best For:** Bold Typography Mobile style: weight="regular". Size 20px for UI controls, 32px for feature anchors. Icons MUST be paired with a Mono-stack text label (JetBrains Mono). Standalone icons only allowed for standard navigation (e.g., Back arrow). Accent color #FF3D00 only.
- **Style:** Outline
- **Semantic Role:** meaningful
- **Allowed Contexts:** decorative|meaningful|interactive

