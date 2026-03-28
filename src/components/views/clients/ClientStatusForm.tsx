import React from 'react';
import type { ClientStatusInfo } from '@/types';

interface Props {
    data: ClientStatusInfo;
    onChange: (field: keyof ClientStatusInfo, value: boolean) => void;
    readOnly?: boolean;
}

const STATUS_LABELS: Record<keyof ClientStatusInfo, string> = {
    possuiCredito: 'Possui Crédito',
    suspensoParado: 'Suspenso / Parado',
    agenteVendas: 'Agente de Vendas',
    permiteVendaPrazo: 'Permite Venda Prazo',
    bloqueadoLiberacao: 'Bloqueado Liberação',
    contratoAssinado: 'Contrato Assinado',
    bloqueado: 'Bloqueado',
    recebimentoCarteira: 'Recebimento em Carteira',
    semRecebimento: 'Sem Recebimento',
    ajudaCusto: 'Ajuda Custo',
};

export function ClientStatusForm({ data, onChange, readOnly }: Props) {
    return (
        <div className="space-y-8 animate-fadeIn">
            <h3 className="font-bold text-lg border-b pb-2">Status do Cliente</h3>
            <p className="text-sm opacity-80 mt-2 mb-4">Flags comportamentais e de controle financeiro.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                {(Object.keys(STATUS_LABELS) as Array<keyof ClientStatusInfo>).map(key => (
                    <label key={key} className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${data[key] ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <input
                            type="checkbox"
                            disabled={readOnly}
                            className="w-5 h-5 accent-primary"
                            checked={data[key] || false}
                            onChange={e => onChange(key, e.target.checked)}
                        />
                        <span className="font-medium text-sm">{STATUS_LABELS[key]}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
