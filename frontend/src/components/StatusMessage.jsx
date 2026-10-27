export default function StatusMessage({ children, variant = 'info' }) {
  return <div className={`status-message status-${variant}`} role={variant === 'error' ? 'alert' : 'status'}>{children}</div>;
}
