'use client';

import React from 'react';
import { useDatePicker } from '@/hooks/useDatePicker';

interface DatePickerFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    inputClassName?: string;
}

const labelClass =
    'text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1 block';
const baseInputClass =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * Campo de data reutilizável com botão de calendário.
 * Elimina o copy-paste do mesmo padrão em EquipmentForm (3x) e outros formulários.
 */
export const DatePickerField: React.FC<DatePickerFieldProps> = ({
    label,
    value,
    onChange,
    disabled = false,
    required = false,
    className = '',
    inputClassName = '',
}) => {
    const { openDatePicker } = useDatePicker(disabled);

    return (
        <div className={className}>
            <label className={labelClass}>
                {label}
                {required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            <div className="date-picker-wrapper relative group">
                <input
                    type="date"
                    disabled={disabled}
                    required={required}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`${baseInputClass} pr-12 cursor-pointer focus:bg-white dark:focus:bg-slate-900 ${inputClassName}`}
                />
                <button
                    type="button"
                    onClick={openDatePicker}
                    disabled={disabled}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-all p-1 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                >
                    <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </button>
            </div>
        </div>
    );
};

export default DatePickerField;
