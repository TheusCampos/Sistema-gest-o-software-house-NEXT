import React from 'react';
import type { ClientModulesInfo } from '@/types';

interface Props {
    data: ClientModulesInfo;
    onChange: (field: keyof ClientModulesInfo, value: boolean) => void;
    readOnly?: boolean;
}

const MODULE_LABELS: Record<keyof ClientModulesInfo, string> = {
    contasReceber: 'Contas a Receber',
    contasPagar: 'Contas a Pagar',
    faturamento: 'Faturamento',
    estoque: 'Estoque',
    nfe: 'NF-e',
    sped: 'SPED',
    spedPisCofins: 'SPED – PIS/COFINS',
    servico: 'Serviço',
    pacote: 'Pacote',
    movimentoBancario: 'Movimento Bancário',
    crediario: 'Crediário',
    nfce: 'NFC-e',
    nfse: 'NFS-e',
    ferramentasGestao: 'Ferramentas de Gestão',
};

export function ClientModulesForm({ data, onChange, readOnly }: Props) {
    return (
        <div className="space-y-8 animate-fadeIn">
            <h3 className="font-bold text-lg border-b pb-2">Módulos Contratados</h3>
            <p className="text-sm opacity-80 mt-2 mb-4">Assinale os módulos que o cliente possui em contrato.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                {(Object.keys(MODULE_LABELS) as Array<keyof ClientModulesInfo>).map(key => (
                    <label key={key} className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${data[key] ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <input
                            type="checkbox"
                            disabled={readOnly}
                            className="w-5 h-5 accent-primary"
                            checked={data[key] || false}
                            onChange={e => onChange(key, e.target.checked)}
                        />
                        <span className="font-medium text-sm">{MODULE_LABELS[key]}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
