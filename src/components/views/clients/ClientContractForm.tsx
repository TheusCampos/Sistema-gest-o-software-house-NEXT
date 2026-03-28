import React from 'react';
import type { ClientContractInfo } from '@/types';

interface Props {
    data: ClientContractInfo;
    onChange: (field: keyof ClientContractInfo, value: string | number | boolean | null | undefined) => void;
    readOnly?: boolean;
    clientId?: string | null;
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function ClientContractForm({ data, onChange, readOnly, clientId }: Props) {
    const inputClass = "w-full rounded-lg border border-[#cfd9e7] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed";

    const handleLiberacaoChange = async (checked: boolean) => {
        if (!clientId) {
            onChange('liberacao', checked);
            return;
        }

        const actionText = checked ? 'liberar' : 'bloquear';
        const confirmMessage = `Tem certeza que deseja ${actionText} o acesso ao sistema para este cliente?`;

        if (window.confirm(confirmMessage)) {
            try {
                const res = await fetch(`/api/clients/${clientId}/liberacao`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ liberacao: checked })
                });

                if (res.ok) {
                    onChange('liberacao', checked);
                    alert(`Sistema ${checked ? 'liberado' : 'bloqueado'} com sucesso!`);
                } else {
                    const errorData = await res.json();
                    alert(`Erro: ${errorData.message || 'Falha ao atualizar a liberação do sistema.'}`);
                }
            } catch (error) {
                console.error("Erro ao alterar liberação:", error);
                alert('Erro de comunicação com o servidor.');
            }
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <h3 className="font-bold text-lg border-b pb-2">Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">
                        Valor de Implantação
                        <span className="material-symbols-outlined text-sm text-slate-400">info</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-500 font-bold">R$</span>
                        <input disabled={readOnly} type="number" step="0.01" value={data.valorImplantacao || ''} onChange={e => onChange('valorImplantacao', parseFloat(e.target.value))} className={`${inputClass} pl-10`} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold flex items-center gap-2">
                        Valor Mensal
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-3 text-slate-500 font-bold">R$</span>
                        <input disabled={readOnly} type="number" step="0.01" value={data.valorMensal || ''} onChange={e => onChange('valorMensal', parseFloat(e.target.value))} className={`${inputClass} pl-10`} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">% Comissão</label>
                    <div className="relative">
                        <input disabled={readOnly} type="number" step="0.01" min={0} max={100} value={data.percentualComissao || ''} onChange={e => onChange('percentualComissao', parseFloat(e.target.value))} className={`${inputClass} pr-10`} />
                        <span className="absolute right-4 top-3 text-slate-500 font-bold">%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">Dia Vencimento</label>
                    <input disabled={readOnly} type="number" min={1} max={31} value={data.diaVencimento || ''} onChange={e => onChange('diaVencimento', parseInt(e.target.value, 10))} className={inputClass} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">Mês de Reajuste</label>
                    <select disabled={readOnly} value={data.mesAjuste || ''} onChange={e => onChange('mesAjuste', e.target.value)} className={inputClass}>
                        <option value="">Selecione...</option>
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">% Reajuste</label>
                    <div className="relative">
                        <input disabled={readOnly} type="number" step="0.01" min={0} max={100} value={data.percentualAjuste || ''} onChange={e => onChange('percentualAjuste', parseFloat(e.target.value))} className={`${inputClass} pr-10`} />
                        <span className="absolute right-4 top-3 text-slate-500 font-bold">%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">Terminais</label>
                    <input disabled={readOnly} type="number" min={1} value={data.terminais || ''} onChange={e => onChange('terminais', parseInt(e.target.value, 10))} className={inputClass} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">Data de Implantação</label>
                    <input disabled={readOnly} type="date" value={data.dataImplantacao || ''} onChange={e => onChange('dataImplantacao', e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold">Início da Cobrança Mensal</label>
                    <input disabled={readOnly} type="date" value={data.inicioMensal || ''} onChange={e => onChange('inicioMensal', e.target.value)} className={inputClass} />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2 relative top-4">
                    <label className="flex items-center gap-3 cursor-pointer p-4 border rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <input disabled={readOnly} type="checkbox" checked={data.liberacao} onChange={e => handleLiberacaoChange(e.target.checked)} className="w-5 h-5 accent-primary" />
                        <div className="flex flex-col">
                            <span className="font-bold">Liberação de Sistema</span>
                            <span className="text-sm opacity-80">Permite que o cliente faça o login na plataforma utilizando seu usuário e senha.</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
