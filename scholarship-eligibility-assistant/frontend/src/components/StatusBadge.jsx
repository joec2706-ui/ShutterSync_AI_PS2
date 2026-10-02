import { STATUS, RULE_RESULT } from '../utils/constants';

export function StatusBadge({ status, size = 'md' }) {
  const s = STATUS[status] || STATUS.NEEDS_MORE_INFORMATION;
  const pad = size === 'lg' ? 'px-4 py-2 text-base' : 'px-2.5 py-1 text-xs';
  return <span className={`inline-flex items-center rounded-md border-l-4 font-bold tracking-wide ${pad} ${s.cls}`}>{s.label}</span>;
}

export function RuleBadge({ result }) {
  const r = RULE_RESULT[result] || RULE_RESULT.UNKNOWN;
  return <span className={`inline-flex shrink-0 items-center rounded-md border-l-4 px-2 py-0.5 text-xs font-bold ${r.cls}`}>{r.label}</span>;
}
