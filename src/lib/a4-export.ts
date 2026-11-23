export const A4_PRINTABLE_HEIGHT_PX = 1020; // 297mm - 14mm margin = 283mm (~1069px), ~49px güvenlik payı

export const A4_DOCUMENT_CSS = `
.a4-sheet {
  width: 210mm;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
  color: #0f172a;
  padding: 8mm 9mm;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.35);
  border-radius: 6px;
  font-family: "Segoe UI", Roboto, system-ui, -apple-system, sans-serif;
  line-height: 1.32;
  box-sizing: border-box;
}

.a4-sheet.a4-mode-one-page {
  padding: 7mm 8mm;
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

.a4-size-xs { font-size: 7.7pt; line-height: 1.26; }
.a4-size-sm { font-size: 8.5pt; line-height: 1.32; }
.a4-size-md { font-size: 9.5pt; line-height: 1.4; }
.a4-size-lg { font-size: 10.5pt; line-height: 1.45; }

.a4-unit-block {
  position: relative;
  display: block;
  width: 100%;
  break-inside: auto;
  page-break-inside: auto;
}

.a4-unit-block + .a4-unit-block {
  margin-top: 8mm;
  padding-top: 6mm;
  border-top: 2px solid #cbd5e1;
  break-before: page;
  page-break-before: always;
}

@media print {
  .a4-unit-block + .a4-unit-block {
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: none !important;
  }
}

.a4-unit-inner {
  width: 100%;
  box-sizing: border-box;
}

.a4-doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  border-bottom: 1.5px solid #1e293b;
  padding-bottom: 4px;
  margin-bottom: 6px;
}

.a4-doc-kicker {
  font-size: 0.76em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #4338ca;
}

.a4-doc-title {
  margin: 1px 0 0 0;
  font-size: 1.28em;
  font-weight: 800;
  color: #0f172a;
}

.a4-doc-meta {
  text-align: right;
  font-size: 0.76em;
  color: #475569;
  white-space: nowrap;
}

.a4-badge {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
  margin-left: 3px;
}

/* Not: Chromium print hatasını önlemek için column-span:all ve kartlarda break-inside:avoid KULLANILMAZ */
.a4-cols-2 {
  column-count: 2;
  column-gap: 5mm;
  column-rule: 1px solid #e2e8f0;
  column-fill: balance;
}

.a4-section-heading {
  font-size: 1.02em;
  font-weight: 800;
  color: #1e293b;
  margin: 6px 0 3px 0;
  padding-bottom: 2px;
  border-bottom: 1px solid #cbd5e1;
  break-after: avoid;
  page-break-after: avoid;
}

.a4-summary-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 3px solid #4338ca;
  border-radius: 3px;
  padding: 4px 7px;
  margin-bottom: 6px;
}

.a4-summary-box p {
  margin: 2px 0 0 0;
  white-space: pre-line;
}

.a4-callout-warn {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-left: 3px solid #d97706;
  border-radius: 3px;
  padding: 4px 7px;
  margin-bottom: 5px;
}

.a4-callout-title {
  font-weight: 700;
  font-size: 0.94em;
  color: #92400e;
  margin-bottom: 2px;
  break-after: avoid;
}

.a4-list {
  margin: 2px 0 0 0;
  padding-left: 14px;
}

.a4-list li {
  margin-bottom: 1.5px;
}

.a4-sec-card {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 4px 7px;
  margin-bottom: 4px;
  background: #ffffff;
  break-inside: auto;
  page-break-inside: auto;
}

.a4-sec-title {
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px 0;
  display: flex;
  align-items: center;
  gap: 5px;
  break-after: avoid;
  page-break-after: avoid;
}

.a4-sec-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  border-radius: 3px;
  background: #1e293b;
  color: #ffffff;
  font-size: 0.78em;
  font-weight: 700;
}

.a4-keywords {
  margin-top: 2px;
  font-size: 0.84em;
  color: #475569;
}

.a4-kw-tag {
  display: inline-block;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 3px;
  padding: 0 3px;
  margin: 1px 2px 0 0;
  font-size: 0.92em;
}

.a4-angle {
  margin-top: 2px;
  padding: 2px 5px;
  border-radius: 3px;
  background: #fef3c7;
  color: #78350f;
  font-size: 0.86em;
}

.a4-table-wrap {
  margin-bottom: 5px;
  break-inside: auto;
}

.a4-table-title {
  font-weight: 700;
  margin-bottom: 2px;
  color: #1e293b;
  break-after: avoid;
}

.a4-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88em;
}

.a4-table thead {
  display: table-header-group;
}

.a4-table th,
.a4-table td {
  border: 1px solid #94a3b8;
  padding: 2.5px 5px;
  text-align: left;
  vertical-align: top;
}

.a4-table th {
  background: #f1f5f9;
  font-weight: 700;
  color: #0f172a;
}

/* Baskıda güvenli akış: CSS Grid yerine düz akış kartları (sayfa atlamayı önler) */
.a4-concept-list {
  display: block;
  margin-bottom: 5px;
}

.a4-concept-card {
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  padding: 3px 6px;
  margin-bottom: 3.5px;
  background: #ffffff;
  break-inside: auto;
  page-break-inside: auto;
}

.a4-concept-card.is-high {
  border-left: 3px solid #e11d48;
}

.a4-concept-term {
  font-weight: 700;
  color: #0f172a;
}

.a4-concept-tip {
  margin-top: 1.5px;
  font-size: 0.85em;
  color: #9f1239;
}

.a4-code-box {
  background: #f8fafc;
  border: 1px solid #94a3b8;
  border-radius: 3px;
  padding: 3px 6px;
  font-family: Consolas, ui-monospace, monospace;
  font-size: 0.82em;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 2px 0;
}

.a4-raw-text {
  white-space: pre-line;
  font-size: 0.9em;
  line-height: 1.38;
  color: #1e293b;
}

.a4-footer-note {
  margin-top: 5px;
  padding-top: 3px;
  border-top: 1px dashed #cbd5e1;
  font-size: 0.74em;
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
    @page { size: A4 portrait; margin: 7mm 8mm; }
    body { margin: 0; padding: 12px; background: #e2e8f0; }
    @media print { body { background: #ffffff; padding: 0; } }
    ${A4_DOCUMENT_CSS}
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;
}
