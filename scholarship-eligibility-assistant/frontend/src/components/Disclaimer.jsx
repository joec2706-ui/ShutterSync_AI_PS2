import { DISCLAIMER } from '../utils/constants';

export default function Disclaimer({ className = '' }) {
  return (
    <p className={`rounded-lg border border-navy-100 bg-navy-50 px-4 py-3 text-xs leading-relaxed text-navy-800 ${className}`}>
      <strong>Note: </strong>{DISCLAIMER}
    </p>
  );
}
