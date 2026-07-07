import { useState, useEffect, useRef } from 'react';
import api from '../../services/authService';
import './AutocompleteInput.css';

interface Props {
  fieldKey: string;
  categoryId?: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AutocompleteInput({
  fieldKey,
  categoryId,
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when value changes
  useEffect(() => {
    if (!value.trim() || value.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          fieldKey,
          search: value,
        });
        if (categoryId) params.append('categoryId', String(categoryId));

        const response = await api.get<string[]>(`/assets/field-values?${params}`);
        const filtered = response.data.filter(
          s => s.toLowerCase() !== value.toLowerCase()
        );
        setSuggestions(filtered);
        setShowDropdown(filtered.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [value, fieldKey, categoryId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(suggestion: string) {
    onChange(suggestion);
    setShowDropdown(false);
    setSuggestions([]);
  }

  return (
    <div className="ac-wrap" ref={wrapRef}>
      <input
        className={className}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        autoComplete="off"
      />
      {showDropdown && (
        <div className="ac-dropdown">
          {loading ? (
            <div className="ac-loading">Searching...</div>
          ) : (
            suggestions.map(s => (
              <div
                key={s}
                className="ac-item"
                onMouseDown={() => handleSelect(s)}
              >
                {s}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}