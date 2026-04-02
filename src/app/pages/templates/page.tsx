'use client';

import React, { useState } from 'react';
import { ImplementationTemplate, ImplementationStep } from '@/types';
import { useApp } from '@/context/AppContext';
import { TemplateCard } from '@/components/business/templates/TemplateCard';
import { TemplateModal } from '@/components/business/templates/TemplateModal';

// Passos padrão (checklist) para acelerar a criação de um roteiro de implantação
const DEFAULT_STEPS_TEXT = [
    "Conversão Base de Dados do Sistema Anterior",
    "Verificação de Equipamentos",
    "Instalação do Banco de Dados",
    "Implantação dos Cadastros de tabelas básicas",
    "Implantação dos Cadastros de Produtos",
    "Implantação dos Cadastros de Clientes",
    "Implantação dos Cadastros de Fornecedores",
    "Implantação dos Cadastros de Serviços",
    "Implantação dos Cadastros de Fórmulas",
    "Implantação dos Cadastros de Formulações",
    "Implantação do Contas a Pagar",
    "Implantação do Movimento de Caixa",
    "Implantação do Contas a Receber",
    "Implantação de Vendas",
    "Implantação de Estoque",
    "Implantação de Compras",
    "Implantação do Controle de Cheques Recebidos",
    "Implantação do Controle de Cheque Emitidos",
    "Implantação do Movimento Bancário",
    "Implantação do Movimento de Vale Mercadoria",
    "Implantação da Nota Fiscal Eletrônica (A1/A3)",
    "Implantação do NFC-e",
    "Implantação do NF-e",
    "Implantação do NFS-e",
    "Faturamento",
    "Implantação do Módulo SPED Fiscal",
    "Implantação do Controle de Projetos",
    "Implantação da Locação de Equipamentos",
    "Implantação de Relatório de DRE"
];

export default function ImplementationTemplatesPage() {
    // Templates disponíveis no tenant (estado global)
    const { implementationTemplates: templates, fetchTemplates, saveTemplate, removeTemplate, currentUser, isTemplatesLoading } = useApp();
    // Busca textual pelo nome do template
    const [searchTerm, setSearchTerm] = useState('');
    // Abre/fecha modal de criar/editar
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Se preenchido, estamos editando um template existente
    const [editingId, setEditingId] = useState<string | null>(null);

    // Carrega dados ao montar
    React.useEffect(() => {
        if (!currentUser?.tenantId) return;
        fetchTemplates(currentUser.tenantId);
    }, [currentUser, fetchTemplates]);

    // Estado do formulário (campos do template sem o id)
    const [formData, setFormData] = useState<Omit<ImplementationTemplate, 'id'>>({
        tenantId: '',
        name: '',
        description: '',
        systemType: 'CRONOS',
        requiresBankConfig: true,
        steps: []
    });

    // Abre o modal para criar ou editar um template
    const handleOpenModal = (template?: ImplementationTemplate) => {
        const tenantId = currentUser?.tenantId || '';
        if (template) {
            setEditingId(template.id);
            setFormData({
                tenantId: template.tenantId,
                name: template.name,
                description: template.description,
                systemType: template.systemType,
                requiresBankConfig: template.requiresBankConfig,
                steps: template.steps
            });
        } else {
            setEditingId(null);
            // Preencher com os passos padrão para facilitar
            const defaultSteps: ImplementationStep[] = DEFAULT_STEPS_TEXT.map((label, index) => ({
                id: `temp-${Date.now()}-${index}`,
                label,
                required: true
            }));

            setFormData({
                tenantId: tenantId,
                name: '',
                description: '',
                systemType: 'CRONOS',
                requiresBankConfig: true,
                steps: defaultSteps
            });
        }
        setIsModalOpen(true);
    };

    // Salva (cria/atualiza) o template no estado global
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                id: editingId || `temp-${Date.now()}`
            } as ImplementationTemplate;

            await saveTemplate(payload);
            setIsModalOpen(false);
        } catch {
            alert('Erro ao salvar roteiro');
        }
    };

    // Exclui um template (confirmação simples)
    const handleDelete = async (id: string) => {
        if (window.confirm('Excluir este modelo de padronização?')) {
            try {
                if (!currentUser?.tenantId) {
                    alert('Sessão inválida. Faça login novamente.');
                    return;
                }
                await removeTemplate(id, currentUser.tenantId);
            } catch {
                alert('Erro ao excluir roteiro');
            }
        }
    };

    // Adiciona um passo em branco ao checklist
    const addStep = () => {
        setFormData(prev => ({
            ...prev,
            steps: [...prev.steps, { id: `new-${Date.now()}`, label: '', required: true }]
        }));
    };

    // Remove passo pelo índice
    const removeStep = (index: number) => {
        setFormData(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }));
    };

    // Atualiza o texto (label) de um passo
    const updateStep = (index: number, label: string) => {
        const newSteps = [...formData.steps];
        newSteps[index].label = label;
        setFormData(prev => ({ ...prev, steps: newSteps }));
    };

    // Alterna se o passo é obrigatório
    const toggleStepRequired = (index: number) => {
        const newSteps = [...formData.steps];
        newSteps[index].required = !newSteps[index].required;
        setFormData(prev => ({ ...prev, steps: newSteps }));
    };

    // Imprime o roteiro (abre em nova janela e chama print)
    const handlePrint = (template: ImplementationTemplate) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Roteiro - ${template.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.5; }
                    h1 { color: #1e293b; margin-bottom: 5px; font-size: 24px; }
                    .meta { color: #64748b; font-size: 14px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
                    .description { margin-bottom: 30px; font-size: 15px; }
                    .section { margin-bottom: 30px; page-break-inside: avoid; }
                    .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px; color: #0f172a; }
                    .step-item { padding: 10px 0; border-bottom: 1px dashed #e2e8f0; display: flex; align-items: flex-start; }
                    .checkbox { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 4px; margin-right: 15px; margin-top: 3px; flex-shrink: 0; }
                    .required-badge { font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-left: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
                    .bank-data { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #f8fafc; }
                    .bank-row { display: flex; margin-bottom: 15px; }
                    .bank-label { font-weight: bold; width: 120px; }
                    .bank-line { flex-grow: 1; border-bottom: 1px solid #94a3b8; margin-left: 10px; }
                    
                    @media print {
                        body { padding: 0; max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <h1>${template.name}</h1>
                <div class="meta">Sistema: ${template.systemType} | Total de Passos: ${template.steps.length}</div>
                ${template.description ? `<div class="description">${template.description}</div>` : ''}
                
                ${template.requiresBankConfig ? `
                <div class="section">
                    <div class="section-title">Dados Bancários (Boleto)</div>
                    <div class="bank-data">
                        <div class="bank-row"><div class="bank-label">Banco:</div><div class="bank-line"></div></div>
                        <div class="bank-row"><div class="bank-label">Agência:</div><div class="bank-line"></div></div>
                        <div class="bank-row"><div class="bank-label">Conta Corrente:</div><div class="bank-line"></div></div>
                        <div class="bank-row"><div class="bank-label">Carteira:</div><div class="bank-line"></div></div>
                        <div class="bank-row"><div class="bank-label">Convênio:</div><div class="bank-line"></div></div>
                    </div>
                </div>
                ` : ''}
                
                <div class="section">
                    <div class="section-title">Checklist de Implantação</div>
                    ${template.steps.map((step, idx) => `
                        <div class="step-item">
                            <div class="checkbox"></div>
                            <div>
                                ${idx + 1}. ${step.label}
                                ${step.required ? '<span class="required-badge">Obrigatório</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Busca por nome
    const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-3 px-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Padronização de Implantação</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Gerencie os roteiros e checklists técnicos para sistemas.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all gap-2 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Novo Roteiro
                </button>
            </div>

            <div className="flex flex-col gap-2 px-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                        placeholder="Buscar por nome do modelo..."
                        type="text"
                    />
                </div>
            </div>

            {/* List */}
            {isTemplatesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
                    <p className="text-slate-500 font-bold animate-pulse">Carregando roteiros...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="px-4 py-20 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">checklist</span>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhum roteiro encontrado.</p>
                </div>
            ) : (
                <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                    {filteredTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                            onPrint={handlePrint}
                        />
                    ))}
                </div>
            )}
            <TemplateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingId={editingId}
                formData={formData}
                setFormData={setFormData}
                handleSave={handleSave}
                addStep={addStep}
                removeStep={removeStep}
                updateStep={updateStep}
                toggleStepRequired={toggleStepRequired}
            />
            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dropIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-dropIn { animation: dropIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
        </div>
    );
}
