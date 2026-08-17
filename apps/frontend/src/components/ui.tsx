import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Button({ children, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'danger' }) {
  return <button className={`button button-${variant}`} {...props}>{children}</button>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warning' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Loading({ label = 'Loading workspace' }: { label?: string }) {
  return <div className="state-panel"><span className="spinner" aria-hidden="true" />{label}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="state-panel"><strong>{title}</strong><span>{description}</span></div>;
}

export function ErrorState({ message = 'Something went wrong.' }: { message?: string }) {
  return <div className="state-panel state-error"><strong>Unable to load this view</strong><span>{message}</span></div>;
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel, busy = false }: { title: string; description: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="eyebrow">CONFIRM ACTION</div><h2 id="confirm-title">{title}</h2><p className="muted">{description}</p><div className="modal-actions"><Button variant="quiet" onClick={onCancel} disabled={busy}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</Button></div></div></div>;
}

export function Toast({ message, tone = 'success', onDismiss }: { message: string; tone?: 'success' | 'error'; onDismiss: () => void }) {
  return <div className={`toast toast-${tone}`} role="status"><span>{message}</span><button aria-label="Dismiss notification" onClick={onDismiss}>×</button></div>;
}
