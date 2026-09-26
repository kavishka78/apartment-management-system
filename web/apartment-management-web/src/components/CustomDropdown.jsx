import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import './CustomDropdown.css';

function CustomDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="cd-wrapper" ref={ref}>
      <button
        type="button"
        className={`cd-trigger ${open ? 'cd-open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="cd-label">{selected ? selected.label : placeholder}</span>
        <FiChevronDown className={`cd-chevron ${open ? 'cd-chevron-up' : ''}`} />
      </button>

      {open && (
        <div className="cd-menu">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`cd-item ${opt.value === value ? 'cd-item-active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <FiCheck className="cd-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
