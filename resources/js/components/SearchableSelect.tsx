import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    error?: string[];
    placeholder?: string;
    required?: boolean;
}

export default function SearchableSelect({ label, value, options, onChange, error, placeholder = 'Type to search…', required }: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!query) return options;
        const q = query.toLowerCase();
        return options.filter(o => o.toLowerCase().includes(q));
    }, [options, query]);

    useEffect(() => { setHighlighted(0); }, [query]);

    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
            if (e.key === 'Enter' && filtered[highlighted]) { e.preventDefault(); select(filtered[highlighted]); }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, filtered, highlighted]);

    const select = (opt: string) => {
        onChange(opt);
        setOpen(false);
        setQuery('');
    };

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
    };

    const displayOpen = () => {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={displayOpen}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between gap-2 transition-colors ${
                        error ? 'border-red-300' : 'border-gray-200 focus:border-sky-300'
                    } ${!value ? 'text-gray-400' : 'text-gray-700'}`}
                >
                    <span className="truncate">{value || placeholder}</span>
                    <div className="flex items-center gap-1 shrink-0">
                        {value && (
                            <span onClick={clear} className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                            </span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {open && (
                    <div ref={listRef} className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-gray-100">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {filtered.length === 0 ? (
                                <div className="px-3 py-2.5 text-sm text-gray-400">No results found</div>
                            ) : (
                                filtered.map((opt, i) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => select(opt)}
                                        onMouseEnter={() => setHighlighted(i)}
                                        className={`w-full px-3 py-2.5 text-sm text-left transition-colors ${
                                            opt === value ? 'bg-sky-50 text-sky-700 font-semibold' : highlighted === i ? 'bg-gray-50' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error[0]}</p>}
        </div>
    );
}
