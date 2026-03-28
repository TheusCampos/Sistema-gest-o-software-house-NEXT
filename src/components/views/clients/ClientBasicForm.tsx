import React from 'react';
import type { ClientGeneralInfo, ClientAddressInfo, Equipment } from '@/types';

interface Props {
    data: ClientGeneralInfo;
    address: ClientAddressInfo;
    onChangeGeneral: (field: keyof ClientGeneralInfo, value: string | null | undefined) => void;
    onChangeAddress: (field: keyof ClientAddressInfo, value: string | null | undefined) => void;
    readOnly?: boolean;
    equipmentList: Equipment[];
}

const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function ClientBasicForm({ data, address, onChangeGeneral, onChangeAddress, readOnly, equipmentList }: Props) {
    const inputClass = "w-full rounded-lg border border-[#cfd9e7] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed";

    // Efeito para limpar UF inválida (caso venha de estado anterior ou erro de digitação)
    React.useEffect(() => {
        if (address.uf && address.uf.length > 2) {
            const cleanUF = address.uf.trim().toUpperCase().substring(0, 2);
            // Verifica se as duas primeiras letras formam uma UF válida
            if (UFS.includes(cleanUF)) {
                onChangeAddress('uf', cleanUF);
            } else {
                onChangeAddress('uf', '');
            }
        }
    }, [address.uf, onChangeAddress]);

    const searchCep = async () => {
        if (readOnly) return;
        await new Promise((resolve) => setTimeout(resolve, 800)); // simulado
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* ── Seção: Dados Gerais ── */}
            <h3 className="font-bold text-lg border-b pb-2">Dados Básicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold">Razão Social</label>
                    <input disabled={readOnly} type="text" value={data.razao} onChange={e => onChangeGeneral('razao', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">Nome Fantasia</label>
                    <input disabled={readOnly} type="text" value={data.fantasia || ''} onChange={e => onChangeGeneral('fantasia', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">Tipo Pessoa</label>
                    <select disabled={readOnly} value={data.tipoPessoa || 'Juridica'} onChange={e => onChangeGeneral('tipoPessoa', e.target.value as 'Juridica' | 'Fisica')} className={inputClass}>
                        <option value="Juridica">Jurídica</option>
                        <option value="Fisica">Física</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">{data.tipoPessoa === 'Juridica' ? 'CNPJ' : 'CPF'}</label>
                    <input disabled={readOnly} type="text" value={data.documento} onChange={e => onChangeGeneral('documento', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">{data.tipoPessoa === 'Juridica' ? 'Inscrição Estadual' : 'RG'}</label>
                    <input disabled={readOnly} type="text" value={data.inscricaoEstadualRg || ''} onChange={e => onChangeGeneral('inscricaoEstadualRg', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">Data de Abertura</label>
                    <input disabled={readOnly} type="date" value={data.dataAbertura || ''} onChange={e => onChangeGeneral('dataAbertura', e.target.value)} className={inputClass} />
                </div>
            </div>

            {/* ── Seção: Contato ── */}
            <h3 className="font-bold text-lg border-b pb-2 mt-8">Contatos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold">E-mail</label>
                    <input disabled={readOnly} type="email" value={data.email} onChange={e => onChangeGeneral('email', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">Telefone 1</label>
                    <input disabled={readOnly} type="text" value={data.telefone1 || ''} onChange={e => onChangeGeneral('telefone1', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">Telefone 2</label>
                    <input disabled={readOnly} type="text" value={data.telefone2 || ''} onChange={e => onChangeGeneral('telefone2', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold">Home Page</label>
                    <input disabled={readOnly} type="url" value={data.homePage || ''} onChange={e => onChangeGeneral('homePage', e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold">Contato Responsável</label>
                    <input disabled={readOnly} type="text" value={data.contatoResponsavel || ''} onChange={e => onChangeGeneral('contatoResponsavel', e.target.value)} className={inputClass} />
                </div>
            </div>

            {/* ── Seção: Informações Adicionais (Inventário) ── */}
            <h3 className="font-bold text-lg border-b pb-2 mt-8">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold">Servidor / VM (Inventário de TI)</label>
                    <select
                        disabled={readOnly}
                        value={data.serverId || ''}
                        onChange={e => onChangeGeneral('serverId', e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Selecione um equipamento...</option>
                        {equipmentList && equipmentList.map(eq => (
                            <option key={eq.id} value={eq.id}>
                                {eq.name} ({eq.type} - {eq.ipAddress || 'Sem IP'})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold">Observações</label>
                    <textarea
                        disabled={readOnly}
                        value={data.observacao || ''}
                        onChange={e => onChangeGeneral('observacao', e.target.value)}
                        className={inputClass}
                        rows={3}
                    />
                </div>
            </div>

            {/* ── Seção: Endereço ── */}
            <h3 className="font-bold text-lg border-b pb-2 mt-8">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold">CEP</label>
                    <div className="flex gap-2">
                        <input disabled={readOnly} type="text" value={address.cep} onChange={e => onChangeAddress('cep', e.target.value)} className={inputClass} />
                        <button type="button" onClick={searchCep} className="bg-slate-100 px-3 rounded-lg"><span className="material-symbols-outlined">search</span></button>
                    </div>
                </div>
                <div className="md:col-span-4 space-y-2"><label className="text-sm font-bold">Logradouro</label><input disabled={readOnly} type="text" value={address.logradouro} onChange={e => onChangeAddress('logradouro', e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-1 space-y-2"><label className="text-sm font-bold">Nº</label><input disabled={readOnly} type="text" value={address.numero} onChange={e => onChangeAddress('numero', e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-3 space-y-2"><label className="text-sm font-bold">Bairro</label><input disabled={readOnly} type="text" value={address.bairro} onChange={e => onChangeAddress('bairro', e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-2 space-y-2"><label className="text-sm font-bold">Complemento</label><input disabled={readOnly} type="text" value={address.complemento || ''} onChange={e => onChangeAddress('complemento', e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-3 space-y-2"><label className="text-sm font-bold">Cidade</label><input disabled={readOnly} type="text" value={address.cidade} onChange={e => onChangeAddress('cidade', e.target.value)} className={inputClass} /></div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold">UF</label>
                    <select
                        disabled={readOnly}
                        value={address.uf}
                        onChange={e => onChangeAddress('uf', e.target.value)}
                        className={inputClass}
                    >
                        <option value="">UF</option>
                        {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}
