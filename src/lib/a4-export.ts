export const A4_DOCUMENT_CSS = `
.a4-sheet {
  width: 210mm;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
  color: #0f172a;
  padding: 13mm 14mm;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.35);
  border-radius: 6px;
  font-family: "Segoe UI", Roboto, system-ui, -apple-system, sans-serif;
  line-height: 1.45;
  box-sizing: border-box;
}

@media print {
  .a4-sheet {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
}

.a4-size-sm { font-size: 8.8pt; }
.a4-size-md { font-size: 9.8pt; }
.a4-size-lg { font-size: 10.8pt; }

.a4-unit-block + .a4-unit-block {
  margin-top: 8mm;
  padding-top: 6mm;
  border-top: 2px solid #cbd5e1;
  break-before: page;
}

.a4-doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  border-bottom: 2px solid #1e293b;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.a4-doc-kicker {
  font-size: 0.78em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4338ca;
}

.a4-doc-title {
  margin: 2px 0 0 0;
  font-size: 1.35em;
  font-weight: 800;
  color: #0f172a;
}

.a4-doc-meta {
  text-align: right;
  font-size: 0.78em;
  color: #475569;
  white-space: nowrap;
}

.a4-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
  margin-left: 4px;
}

.a4-cols-2 {
  column-count: 2;
  column-gap: 6mm;
  column-rule: 1px solid #e2e8f0;
}

.a4-section-heading {
  font-size: 1.08em;
  font-weight: 800;
  color: #1e293b;
  margin: 10px 0 5px 0;
  padding-bottom: 3px;
  border-bottom: 1px solid #cbd5e1;
  break-after: avoid;
  column-span: all;
}

.a4-summary-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 3.5px solid #4338ca;
  border-radius: 4px;
  padding: 7px 10px;
  margin-bottom: 9px;
  break-inside: avoid;
}

.a4-summary-box p {
  margin: 3px 0 0 0;
  white-space: pre-line;
}

.a4-callout-warn {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-left: 3.5px solid #d97706;
  border-radius: 4px;
  padding: 7px 10px;
  margin-bottom: 9px;
  break-inside: avoid;
}

.a4-callout-title {
  font-weight: 700;
  font-size: 0.94em;
  color: #92400e;
  margin-bottom: 3px;
}

.a4-list {
  margin: 3px 0 0 0;
  padding-left: 16px;
}

.a4-list li {
  margin-bottom: 2.5px;
}

.a4-sec-card {
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 6px 9px;
  margin-bottom: 7px;
  background: #ffffff;
  break-inside: avoid;
}

.a4-sec-title {
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.a4-sec-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 4px;
  background: #1e293b;
  color: #ffffff;
  font-size: 0.8em;
  font-weight: 700;
}

.a4-keywords {
  margin-top: 4px;
  font-size: 0.85em;
  color: #475569;
}

.a4-kw-tag {
  display: inline-block;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 3px;
  padding: 0 4px;
  margin: 2px 3px 0 0;
  font-size: 0.92em;
}

.a4-angle {
  margin-top: 4px;
  padding: 3px 6px;
  border-radius: 3px;
  background: #fef3c7;
  color: #78350f;
  font-size: 0.88em;
}

.a4-table-wrap {
  margin-bottom: 8px;
  break-inside: avoid;
}

.a4-table-title {
  font-weight: 700;
  margin-bottom: 3px;
  color: #1e293b;
}

.a4-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.a4-table thead {
  display: table-header-group;
}

.a4-table th,
.a4-table td {
  border: 1px solid #94a3b8;
  padding: 4px 6px;
  text-align: left;
  vertical-align: top;
}

.a4-table th {
  background: #f1f5f9;
  font-weight: 700;
  color: #0f172a;
}

.a4-concept-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;
}

.a4-cols-2 .a4-concept-grid {
  grid-template-columns: 1fr;
}

.a4-concept-card {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 5px 8px;
  background: #ffffff;
  break-inside: avoid;
}

.a4-concept-card.is-high {
  border-left: 3px solid #e11d48;
}

.a4-concept-term {
  font-weight: 700;
  color: #0f172a;
}

.a4-concept-tip {
  margin-top: 3px;
  font-size: 0.86em;
  color: #9f1239;
}

.a4-code-box {
  background: #f8fafc;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  padding: 5px 8px;
  font-family: Consolas, ui-monospace, monospace;
  font-size: 0.84em;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 4px 0;
}

.a4-raw-text {
  white-space: pre-line;
  font-size: 0.94em;
  line-height: 1.5;
  color: #1e293b;
}

.a4-footer-note {
  margin-top: 8px;
  padding-top: 5px;
  border-top: 1px dashed #cbd5e1;
  font-size: 0.78em;
  color: #64748b;
}
`;

export function slugifyFileName(text: string): string {
  return text
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildStandaloneA4Html(title: string, innerHtml: string): string {
  const safeTitle = title.replace(/[<>&"]/g, "");
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    @page { size: A4 portrait; margin: 11mm 12mm; }
    body { margin: 0; padding: 14px; background: #e2e8f0; }
    @media print { body { background: #ffffff; padding: 0; } }
    ${A4_DOCUMENT_CSS}
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;
}
