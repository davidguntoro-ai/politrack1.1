import React, { useState, useEffect } from 'react';
import { PROFESSIONS, OTHER_PROFESSION } from '../types';

interface ProfessionSelectProps {
  value: string;
  onChange: (value: string) => void;
  selectClassName?: string;
  inputClassName?: string;
  required?: boolean;
}

export const ProfessionSelect: React.FC<ProfessionSelectProps> = ({
  value,
  onChange,
  selectClassName = '',
  inputClassName = '',
  required = false,
}) => {
  const isKnownProfession = (v: string) =>
    PROFESSIONS.includes(v as typeof PROFESSIONS[number]);

  const deriveSelectVal = (v: string) =>
    v === '' ? '' : isKnownProfession(v) ? v : OTHER_PROFESSION;

  const deriveCustomText = (v: string) =>
    !isKnownProfession(v) && v !== '' && v !== OTHER_PROFESSION ? v : '';

  const [selectVal, setSelectVal] = useState(() => deriveSelectVal(value));
  const [customText, setCustomText] = useState(() => deriveCustomText(value));

  useEffect(() => {
    setSelectVal(deriveSelectVal(value));
    setCustomText(deriveCustomText(value));
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sel = e.target.value;
    setSelectVal(sel);
    if (sel !== OTHER_PROFESSION) {
      setCustomText('');
      onChange(sel);
    } else {
      onChange('');
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomText(text);
    onChange(text);
  };

  return (
    <div className="space-y-2">
      <select
        value={selectVal}
        onChange={handleSelectChange}
        required={required}
        className={selectClassName}
      >
        <option value="">Pilih Pekerjaan</option>
        {PROFESSIONS.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      {selectVal === OTHER_PROFESSION && (
        <input
          type="text"
          value={customText}
          onChange={handleCustomChange}
          placeholder="Tuliskan profesi spesifik Anda..."
          required={required}
          className={inputClassName}
        />
      )}
    </div>
  );
};
