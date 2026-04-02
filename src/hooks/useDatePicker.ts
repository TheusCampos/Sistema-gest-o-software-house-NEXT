import { type MouseEvent } from 'react';

/**
 * Hook que encapsula o handler para abrir o DatePicker nativo do browser.
 * Elimina a duplicação em EquipmentForm (3x copy-paste) e ClientForm.
 */
export function useDatePicker(readOnly = false) {
    const openDatePicker = (e: MouseEvent<HTMLButtonElement>) => {
        const input = e.currentTarget
            .closest('.date-picker-wrapper')
            ?.querySelector('input') as (HTMLInputElement & { showPicker?: () => void }) | null;

        if (!input || readOnly) return;

        try {
            if (typeof input.showPicker === 'function') {
                input.showPicker();
            } else {
                input.focus();
            }
        } catch {
            input.focus();
        }
    };

    return { openDatePicker };
}
