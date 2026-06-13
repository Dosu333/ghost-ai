function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderInlineMarkdown(value: string) {
  const placeholders: string[] = []

  const withCodePlaceholders = value.replace(/`([^`]+)`/g, (_match, code: string) => {
    const token = `__CODE_${placeholders.length}__`
    placeholders.push(`<code>${escapeHtml(code)}</code>`)
    return token
  })

  const escaped = escapeHtml(withCodePlaceholders)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")

  return placeholders.reduce(
    (current, placeholder, index) =>
      current.replace(`__CODE_${index}__`, placeholder),
    escaped
  )
}

function renderParagraph(lines: string[]) {
  return `<p>${renderInlineMarkdown(lines.join(" "))}</p>`
}

export function renderMarkdownToHtml(markdown: string) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n")
  const html: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      index += 1
      continue
    }

    if (trimmedLine.startsWith("```")) {
      const language = trimmedLine.slice(3).trim()
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        index += 1
      }

      html.push(
        `<pre><code${language ? ` data-language="${escapeHtml(language)}"` : ""}>${escapeHtml(codeLines.join("\n"))}</code></pre>`
      )
      continue
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/)

    if (headingMatch) {
      const level = headingMatch[1].length
      html.push(
        `<h${level}>${renderInlineMarkdown(headingMatch[2].trim())}</h${level}>`
      )
      index += 1
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmedLine)) {
      html.push("<hr />")
      index += 1
      continue
    }

    if (/^>\s?/.test(trimmedLine)) {
      const quoteLines: string[] = []

      while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""))
        index += 1
      }

      html.push(`<blockquote>${renderParagraph(quoteLines)}</blockquote>`)
      continue
    }

    if (/^[-*+]\s+/.test(trimmedLine)) {
      const items: string[] = []

      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(
          `<li>${renderInlineMarkdown(
            lines[index].trim().replace(/^[-*+]\s+/, "")
          )}</li>`
        )
        index += 1
      }

      html.push(`<ul>${items.join("")}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(trimmedLine)) {
      const items: string[] = []

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(
          `<li>${renderInlineMarkdown(
            lines[index].trim().replace(/^\d+\.\s+/, "")
          )}</li>`
        )
        index += 1
      }

      html.push(`<ol>${items.join("")}</ol>`)
      continue
    }

    const paragraphLines = [trimmedLine]
    index += 1

    while (index < lines.length) {
      const nextTrimmedLine = lines[index].trim()

      if (
        !nextTrimmedLine ||
        nextTrimmedLine.startsWith("```") ||
        /^(#{1,6})\s+/.test(nextTrimmedLine) ||
        /^>\s?/.test(nextTrimmedLine) ||
        /^[-*+]\s+/.test(nextTrimmedLine) ||
        /^\d+\.\s+/.test(nextTrimmedLine) ||
        /^(-{3,}|\*{3,})$/.test(nextTrimmedLine)
      ) {
        break
      }

      paragraphLines.push(nextTrimmedLine)
      index += 1
    }

    html.push(renderParagraph(paragraphLines))
  }

  return html.join("\n")
}
