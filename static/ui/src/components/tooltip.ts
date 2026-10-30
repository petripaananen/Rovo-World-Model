/**
 * Reusable Tooltip & Plain-English Formatting Utilities (`static/ui/src/components/tooltip.ts`)
 *
 * Provides:
 * 1. `renderInfoTooltip(title, body, formula)`: Renders a sleek `?` badge that reveals
 *    technical math/formulas on hover without cluttering the primary UI.
 * 2. `formatFriendlyDate(isoDate)`: Converts `2026-12-14` -> `Dec 14, 2026` (or `Dec 14`).
 */

export function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatFriendlyDate(isoDate: string, includeYear = false): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthName = months[(m - 1) % 12] ?? 'Nov';
  return includeYear ? `${monthName} ${d}, ${y}` : `${monthName} ${d}`;
}

export function renderInfoTooltip(
  title: string,
  explanation: string,
  mathFormula?: string
): string {
  return `
    <span class="info-tooltip-wrap" tabindex="0">
      <span class="info-badge" aria-label="More info">?</span>
      <span class="info-popover">
        <strong class="info-popover-title">${escapeHtmlText(title)}</strong>
        <span class="info-popover-body">${escapeHtmlText(explanation)}</span>
        ${
          mathFormula
            ? `<code class="info-popover-math">📐 ${escapeHtmlText(mathFormula)}</code>`
            : ''
        }
      </span>
    </span>
  `;
}

