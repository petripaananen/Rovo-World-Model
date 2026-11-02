/**
 * Reusable Tooltip, Date, Lozenge & Avatar Utilities (`static/ui/src/components/tooltip.ts`)
 *
 * Implements Atlassian Design System (ADS) helpers:
 * 1. `renderInfoTooltip(title, explanation, mathFormula)`: Renders a clean ADS `?` badge that reveals
 *    technical math/formulas on hover without cluttering the primary Jira view.
 * 2. `formatFriendlyDate(isoDate)`: Converts `2026-12-14` -> `Dec 14, 2026`.
 * 3. `renderJiraStatusLozenge(status)`: Renders an authentic rectangular Jira lozenge (`TO DO`, `IN PROGRESS`, `DONE`, `AT RISK`).
 * 4. `getInitials(name)`: Extracts 2-letter avatar initials (e.g. `PP`, `MC`).
 */

export function escapeHtmlText(str: string | undefined | null): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatFriendlyDate(
  isoDate: string | undefined | null,
  includeYear = false
): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return String(isoDate ?? 'N/A');
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

export function getInitials(name: string | undefined | null): string {
  if (!name || name.toLowerCase() === 'unassigned') return 'UA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function renderJiraStatusLozenge(status: string | undefined | null): string {
  const safeStatus = String(status || 'To Do');
  const lower = safeStatus.toLowerCase();
  if (lower === 'done' || lower === 'completed') {
    return `<span class="jira-lozenge jira-lozenge-done">DONE</span>`;
  }
  if (lower.includes('risk') || lower.includes('block') || lower === 'off track') {
    return `<span class="jira-lozenge jira-lozenge-danger">${escapeHtmlText(safeStatus.toUpperCase())}</span>`;
  }
  if (lower.includes('progress')) {
    return `<span class="jira-lozenge jira-lozenge-inprogress">IN PROGRESS</span>`;
  }
  return `<span class="jira-lozenge jira-lozenge-todo">TO DO</span>`;
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
