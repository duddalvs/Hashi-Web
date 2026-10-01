import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Search, X, Inbox, LoaderCircle } from 'lucide-react';
import { matches } from '../domain/rules';

export function Brand() {
  return (
    <span className="wordmark">
      hashi<span className="brand-dot">.</span>
    </span>
  );
}
export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </div>
  );
}
export function Empty({
  title = 'Nenhum registro encontrado',
  text = 'Tente ajustar os filtros ou cadastrar um novo envio.',
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={30} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export type Option = { value: string; label: string; description?: string };
export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Todos',
  clearable = true,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const filtered = options.filter((o) => matches(`${o.label} ${o.description ?? ''}`, search));
  const selected = options.find((o) => o.value === value);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function choose(v: string) {
    onChange(v);
    setOpen(false);
    setSearch('');
    trigger.current?.focus();
  }
  return (
    <div
      className={`field select-field ${open ? 'is-open' : ''}`}
      ref={root}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <span id={`${id}-label`}>{label}</span>
      <button
        ref={trigger}
        type="button"
        className={`select-trigger ${value ? 'selected' : ''}`}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setSearch('');
          setActive(0);
        }}
      >
        <span id={`${id}-value`}>
          {selected?.label ?? (value ? 'Referência indisponível — selecione outra' : placeholder)}
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="select-popover">
          <div className="select-search">
            <Search size={15} />
            <input
              ref={input}
              aria-label={`Pesquisar ${label.toLowerCase()}`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActive(0);
              }}
              placeholder="Digite para pesquisar…"
              role="combobox"
              aria-autocomplete="list"
              aria-controls={`${id}-list`}
              aria-expanded="true"
              aria-activedescendant={filtered[active] ? `${id}-option-${active}` : undefined}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, filtered.length - 1));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((i) => Math.max(0, i - 1));
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filtered[active]) choose(filtered[active].value);
                }
              }}
            />
          </div>
          <div className="select-options" id={`${id}-list`} role="listbox" aria-label={label}>
            {clearable && (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className="clear-option"
                onClick={() => choose('')}
              >
                {placeholder}
              </button>
            )}
            {filtered.map((o, i) => (
              <button
                type="button"
                role="option"
                id={`${id}-option-${i}`}
                aria-selected={value === o.value}
                key={o.value}
                className={i === active ? 'keyboard-active' : ''}
                onClick={() => choose(o.value)}
              >
                <span>
                  {o.label}
                  {o.description && <small>{o.description}</small>}
                </span>
                {value === o.value && <Check size={15} />}
              </button>
            ))}
            {!filtered.length && <p className="no-options">Nenhuma opção encontrada.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide,
  busy,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={id}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
