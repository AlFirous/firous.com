## Commit message

Write clear, concise commit messages following Conventional Commits specification.

### Format

<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

### Types

- **fix**: Bug fixes (PATCH)
- **feat**: New features (MINOR)
- **BREAKING CHANGE**: Breaking changes (MAJOR) - use `!` after type/scope or in footer
- **Other**: build, chore, ci, docs, style, refactor, perf, test

### Style Guidelines

- **Subject line**: Imperative mood, capitalize, no period, ~50 chars max
- **Body**: Optional, wrap at 72 chars, provide useful context only
- **Separate**: Blank line between subject and body
- **No repetition**: Don't repeat subject in body
- **No diffs**: Don't include raw diff output
- Don't wrap in markdown code block

### Output

Return only the commit message, no meta-commentary.
