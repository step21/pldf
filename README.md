# Browser-Based Interview System

A lightweight, client-side interview/wizard system that generates documents from templates based on user responses.

## Features

- No backend required
- Declarative document format
- Multiple question types (text, number, yes/no, dropdown, etc.)
- Conditional logic and computed fields
- Template-based document generation
- Shareable URLs with compressed state
- Decision flow visualization with Mermaid.js
- Export to Markdown and HTML

## Quick Start

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. The system will load the default interview from `interviews/sample.yaml`

## Creating Interviews

Interviews are defined in YAML format with the following structure:

```yaml
metadata:
  title: "Interview Title"
  description: "Description"
  version: "1.0"

questions:
  - id: unique_id
    type: text|integer|yesno|dropdown|radio|checkboxes
    question: "Question text?"
    variable: variable_name
    required: true|false
    show_if: "condition"
    validation:
      # Type-specific validation rules

templates:
  - name: template_name
    format: markdown
    content: |
      # Document Title
      Your content with {{variables}}
```

Question Types

text: Single-line text input
integer: Whole number input
number: Decimal number input
email: Email address input
yesno: Yes/No radio buttons
dropdown: Single selection from list
radio: Single selection with radio buttons
checkboxes: Multiple selection

Conditional Logic
Use `show_if` to conditionally display questions:
yaml```
show_if: "age >= 18"
show_if: "country === 'USA'"
show_if: "has_license === true"
```

## Templates
Templates use Mustache syntax for variables:

`{{variable_name}}` - Display variable
`{{#condition}}...{{/condition}}` - Conditional section
`{{^condition}}...{{/condition}}` - Inverted section

## URL Parameters

`?interview=path/to/interview.yaml` - Load specific interview
`?state=compressed_state` - Load saved state

## License

GPL-3.0 License