'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useContractsStore } from '@/stores/contractsStore';
import { useSellersStore } from '@/stores/sellersStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useAuthStore } from '@/stores/authStore';

import { CommissionProjection } from '@/components/business/contracts/CommissionProjection';
import { ContractMinuta } from '@/components/business/contracts/ContractMinuta';
import { RichTextEditor } from '@/components/business/tickets/RichTextEditor';
import type { Contract, ContractItem } from '@/types';

interface ContractFormProps {
    contractId?: string | null;
    readOnly?: boolean;
}

const ContractForm: React.FC<ContractFormProps> = ({ contractId, readOnly = false }) => {
    const { contracts, saveContract } = useContractsStore();
    const { sellers, fetchSellers } = useSellersStore();
    const { clients, fetchClients } = useClientsStore();
    const currentUser = useAuthStore(s => s.currentUser);
    
    const router = useRouter();
    const isEditing = !!contractId;

    const [formData, setFormData] = useState<ContractFormData>({
        contractNumber: '',
        clientId: '',
        clientName: '',
        sellerId: '',
        plan: 'Professional',
        type: 'Licenciamento SaaS',
        mrr: '',
        totalValue: '',
        implementationValue: '',
        startDate: '',
        endDate: '',
        billingDay: '10',
        notes: '',
        status: 'Ativo',
        items: [],
        legalText: ''
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tempLegalText, setTempLegalText] = useState('');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentUser?.tenantId) {
            fetchSellers(currentUser.tenantId);
            fetchClients(currentUser.tenantId);
        }
    }, [currentUser, fetchSellers, fetchClients]);

    useEffect(() => {
        if (!isEditing && !formData.contractNumber) {
            setFormData(prev => ({
                ...prev,
                contractNumber: `CT-${Math.floor(10000 + Math.random() * 90000)}`
            }));
        }
    }, [isEditing, formData.contractNumber]);

    useEffect(() => {
        if (contractId) {
            const existing = contracts.find(c => c.id === contractId);
            if (existing) {
                setFormData({
                    contractNumber: existing.contractNumber,
                    clientId: existing.clientId || '',
                    clientName: existing.clientName,
                    sellerId: existing.sellerId || '',
                    plan: existing.plan,
                    type: existing.type,
                    mrr: existing.mrr,
                    totalValue: existing.totalValue,
                    implementationValue: existing.implementationValue || '',
                    startDate: existing.startDate,
                    endDate: existing.endDate,
                    billingDay: existing.billingDay || '10',
                    notes: existing.notes || '',
                    status: existing.status,
                    items: existing.items || [],
                    legalText: existing.legalText || '',
                });
            }
        }
    }, [contractId, contracts]);

    const handleInputChange = <K extends keyof ContractFormData>(field: K, value: ContractFormData[K]) => {
        if (readOnly) return;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateItem = <K extends keyof ContractItem>(id: string, field: K, value: ContractItem[K]) => {
        if (readOnly) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(i => i.id === id ? { ...i, [field]: value } : i)
        }));
    };

    const selectedSeller = useMemo(() => sellers.find(s => s.id === formData.sellerId), [sellers, formData.sellerId]);
    
    const contractLegalText = useMemo(() => {
        const client = clients.find(c => c.id === formData.clientId);
        const contactInfo = client 
            ? `${client.general.razao || client.general.fantasia}, inscrito no CPF/CNPJ sob o nº ${client.general.documento || 'N/A'}, residente e domiciliado em ${client.address?.logradouro || 'N/A'}, ${client.address?.numero || 'S/N'}, ${client.address?.bairro || 'N/A'}, ${client.address?.cidade || 'N/A'}/${client.address?.uf || 'N/A'}, CEP ${client.address?.cep || 'N/A'}, telefone ${client.general.telefone1 || 'N/A'}`
            : '[DADOS DO CLIENTE NÃO SELECIONADOS]';

        const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        const itemsListHtml = formData.items.length > 0
            ? `<ul style="margin-top: 10px; margin-bottom: 10px; list-style-type: disc; padding-left: 20px;">` + 
              formData.items.map(i => `<li>${i.quantity}x ${i.description || 'Módulo'} - R$ ${Number(i.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>`).join('') + 
              `</ul>`
            : '<p><em>[MÓDULOS NÃO ESPECIFICADOS]</em></p>';

        return `
<h1 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 25px;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SOFTWARE</h1>

<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px;">1. PREÂMBULO (PARTES)</h3>
<p><strong>CONTRATANTE:</strong> ${contactInfo}.</p>
<p><strong>CONTRATADA:</strong> Zeus Enterprise Manager, sediada em localidade de registro de sistema, inscrita no CNPJ sob o nº [CNPJ_DA_EMPRESA], representada neste ato conforme seus atos constitutivos.</p>

<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px;">2. OBJETO</h3>
<p>O presente contrato tem como objeto o licenciamento de uso do software ZEUS ERP, contemplando os seguintes módulos e serviços:</p>
${itemsListHtml}

<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px;">3. PREÇO E FORMA DE PAGAMENTO</h3>
<p>Pela prestação dos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor mensal de <strong>R$ ${formData.mrr || '0'}</strong>, com vencimento todo <strong>dia ${formData.billingDay}</strong> de cada mês. A taxa de implantação acordada é de <strong>R$ ${formData.implementationValue || '0'}</strong>.</p>
<p>Os pagamentos deverão ser realizados via boleto bancário ou transferência identificada para as contas informadas pela CONTRATADA.</p>

<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px;">4. OBRIGAÇÕES DAS PARTES</h3>
<p><strong>DA CONTRATADA:</strong> Garantir a disponibilidade do software, suporte técnico básico e atualizações de segurança.</p>
<p><strong>DA CONTRATANTE:</strong> Utilizar o software nos termos licenciados, manter seus dados de pagamento em dia e zelar pela confidencialidade das credenciais de acesso.</p>

<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px;">5. PRAZO E RESCISÃO</h3>
<p>O contrato tem início em ${formData.startDate || 'DATA_INICIO'} e validade até ${formData.endDate || 'DATA_FIM'}. Em caso de rescisão antecipada por parte da CONTRATANTE sem justa causa, será aplicada multa de 20% sobre o saldo remanescente do contrato.</p>

<h3 style="font-size: 14px; margin-top: 15px; margin-bottom: 5px;">6. FORO</h3>
<p>As partes elegem o foro da Comarca de registro da CONTRATADA para dirimir quaisquer dúvidas oriundas deste instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>

<h3 style="font-size: 14px; margin-top: 25px; margin-bottom: 5px;">7. ASSINATURAS</h3>
<p style="margin-top: 20px;">Local e Data: ${dateStr}.</p>
<br/><br/>
<table style="width: 100%; border-collapse: collapse;">
<tr>
<td style="width: 45%; border-top: 1px solid black; text-align: center; padding-top: 5px;">CONTRATANTE</td>
<td style="width: 10%;"></td>
<td style="width: 45%; border-top: 1px solid black; text-align: center; padding-top: 5px;">CONTRATADA</td>
</tr>
</table>
`.trim();
    }, [formData, clients]);

    const displayLegalText = formData.legalText || contractLegalText;

    const handleOpenEdit = () => {
        setTempLegalText(displayLegalText);
        setIsEditModalOpen(true);
    };

    const handleSaveCustomText = () => {
        handleInputChange('legalText', tempLegalText);
        setIsEditModalOpen(false);
    };

    const handleResetText = () => {
        handleInputChange('legalText', '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly || !currentUser?.tenantId) return;

        setSaving(true);
        try {
            await saveContract({
                id: isEditing ? (contractId as string) : self.crypto.randomUUID(),
                tenantId: currentUser.tenantId,
                clientLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.clientName || 'C')}&background=random`,
                ...formData
            } as Contract);
            router.push('/contracts');
        } catch {
            alert('Erro ao salvar contrato.');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-3.5 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm disabled:opacity-50 shadow-sm";
    const labelClass = "text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 block";

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 animate-fadeIn">
            <nav className="flex items-center gap-2 text-sm">
                <Link href="/contracts" className="text-slate-400 hover:text-primary font-medium">Contratos</Link>
                <span className="text-primary font-bold">/ {readOnly ? 'Visualizar' : isEditing ? 'Editar' : 'Novo'}</span>
            </nav>

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {readOnly ? 'Documentação' : isEditing ? 'Atualizar Contrato' : 'Novo Acordo'}
                    </h1>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</span>
                    <span className="text-xl font-mono font-bold text-primary">{formData.contractNumber}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <form className="p-8 space-y-8" onSubmit={handleSubmit}>
                            {/* Sessão de Dados Principais */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Cliente</label>
                                    <select disabled={readOnly || isEditing} value={formData.clientId || ''} onChange={e => {
                                        const c = clients.find(cl => cl.id === e.target.value);
                                        if (c) handleInputChange('clientName', c.general.razao || c.general.fantasia || '');
                                        handleInputChange('clientId', e.target.value);
                                    }} className={`${inputClass} appearance-none`}>
                                        <option value="">Selecione...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.general.razao || c.general.fantasia}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Vendedor</label>
                                    <select disabled={readOnly} value={formData.sellerId || ''} onChange={e => handleInputChange('sellerId', e.target.value)} className={inputClass}>
                                        <option value="">Selecione...</option>
                                        {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Tipo</label>
                                    <select disabled={readOnly} value={formData.type} onChange={e => handleInputChange('type', e.target.value as Contract['type'])} className={inputClass}>
                                        <option value="Licenciamento SaaS">Licenciamento SaaS</option>
                                        <option value="Manutenção">Manutenção</option>
                                        <option value="Projeto Específico">Projeto Específico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select disabled={readOnly} value={formData.status} onChange={e => handleInputChange('status', e.target.value as Contract['status'])} className={inputClass}>
                                        <option value="Ativo">Ativo</option>
                                        <option value="Atrasado">Atrasado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                                <div>
                                    <label className={`${labelClass} h-8 flex items-end`}>Implantação</label>
                                    <input disabled={readOnly} type="number" value={formData.implementationValue} onChange={e => handleInputChange('implementationValue', e.target.value)} className={inputClass} placeholder="0,00" />
                                </div>
                                <div>
                                    <label className={`${labelClass} h-8 flex items-end`}>MRR (Mensal)</label>
                                    <input disabled={readOnly} type="number" value={formData.mrr} onChange={e => handleInputChange('mrr', e.target.value)} className={inputClass} placeholder="0,00" />
                                </div>
                                <div>
                                    <label className={`${labelClass} h-8 flex items-end`}>Vencimento</label>
                                    <select disabled={readOnly} value={formData.billingDay} onChange={e => handleInputChange('billingDay', e.target.value)} className={inputClass}>
                                        <option value="5">Dia 05</option>
                                        <option value="10">Dia 10</option>
                                        <option value="15">Dia 15</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`${labelClass} h-8 flex items-end`}>Início Vigência</label>
                                    <input disabled={readOnly} type="date" value={formData.startDate} onChange={e => handleInputChange('startDate', e.target.value)} className={`${inputClass} !px-3`} />
                                </div>
                                <div>
                                    <label className={`${labelClass} h-8 flex items-end`}>Fim Vigência</label>
                                    <input disabled={readOnly} type="date" value={formData.endDate} onChange={e => handleInputChange('endDate', e.target.value)} className={`${inputClass} !px-3`} />
                                </div>
                            </div>

                             {/* Itens */}
                            <div className="space-y-6 p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Módulos & Serviços</h3>
                                    {readOnly ? null : (
                                        <button type="button" onClick={() => handleInputChange('items', [...formData.items, { id: self.crypto.randomUUID(), description: '', quantity: 1, unitValue: 0 }])} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                                            <span className="material-symbols-outlined text-lg">add_circle</span>
                                            Adicionar
                                        </button>
                                    )}
                                </div>
                                
                                <div className="space-y-3">
                                    {formData.items.map((item, idx) => (
                                        <div key={item.id} className="group flex gap-3 items-center p-2 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <input disabled={readOnly} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="flex-1 bg-transparent border-none px-2 py-2 text-sm outline-none placeholder:text-slate-300" placeholder="Descrição do módulo ou serviço..." />
                                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1">
                                                <input disabled={readOnly} type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-10 bg-transparent border-none text-center text-xs font-bold outline-none" />
                                                <span className="text-[10px] text-slate-400">qtd</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1">
                                                <span className="text-[10px] text-slate-400">R$</span>
                                                <input disabled={readOnly} type="number" value={item.unitValue} onChange={e => updateItem(item.id, 'unitValue', Number(e.target.value))} className="w-20 bg-transparent border-none text-right text-xs font-bold outline-none" />
                                            </div>
                                            {!readOnly && (
                                                <button type="button" onClick={() => handleInputChange('items', formData.items.filter(i => i.id !== item.id))} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {formData.items.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-xs italic">
                                            Nenhum módulo adicionado ainda.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="space-y-2">
                                <label className={labelClass}>Observações Internas (Não aparecem no contrato)</label>
                                <textarea 
                                    disabled={readOnly}
                                    value={formData.notes || ''}
                                    onChange={e => handleInputChange('notes', e.target.value)}
                                    className={`${inputClass} min-h-[100px] resize-none`}
                                    placeholder="Ex: Cliente solicitou alteração no layout ou detalhes específicos da negociação..."
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <Link href="/contracts" className="px-6 py-3 font-bold text-slate-500">Cancelar</Link>
                                {!readOnly && (
                                    <button type="submit" disabled={saving} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50">
                                        {saving ? 'Gravando...' : 'Salvar Contrato'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {selectedSeller && (
                        <CommissionProjection 
                            seller={selectedSeller} 
                            implementationValue={formData.implementationValue || ''} 
                            mrr={formData.mrr || ''} 
                        />
                    )}
                    <ContractMinuta 
                        legalText={displayLegalText} 
                        contractNumber={formData.contractNumber} 
                        onEdit={readOnly ? undefined : handleOpenEdit}
                        onReset={formData.legalText ? handleResetText : undefined}
                    />
                    {formData.legalText && !readOnly && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-[2rem] border border-amber-100 dark:border-amber-800/50 flex gap-3 animate-slideUp">
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
                            <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-tight">
                                <strong>Minuta Customizada:</strong> Alterações nos campos acima não serão refletidas automaticamente no texto. Clique no ícone de &quot;reset&quot; na minuta para voltar ao padrão dinâmico.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Edição de Contrato */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleIn">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Editar Minuta do Contrato</h3>
                                <p className="text-sm text-slate-500">Altere o texto do contrato conforme necessário.</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                        </div>
                        <div className="p-8">
                            <RichTextEditor
                                value={tempLegalText}
                                onChange={setTempLegalText}
                                className="h-[500px]"
                            />
                        </div>
                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 font-bold text-slate-500">Descartar</button>
                            <button onClick={handleSaveCustomText} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractForm;

type ContractFormData = Omit<Contract, 'id' | 'tenantId' | 'clientLogo'>;
