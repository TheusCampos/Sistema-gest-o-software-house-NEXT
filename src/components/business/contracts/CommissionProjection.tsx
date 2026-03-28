'use client';

import React from 'react';
import type { Seller } from '@/types';

interface CommissionProjectionProps {
    seller: Seller;
    implementationValue: string;
    mrr: string;
}

export const CommissionProjection: React.FC<CommissionProjectionProps> = ({ 
    seller, 
    implementationValue, 
    mrr 
}) => {
    const commissionImp = implementationValue ? (Number(implementationValue) * seller.commissionImplementation / 100) : 0;
    const commissionMon = mrr ? (Number(mrr) * seller.commissionMonthly / 100) : 0;

    return (
        <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-6 text-white shadow-xl animate-scaleIn">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">payments</span>
                Projeção de Comissões
            </h3>
            <div className="space-y-6">
                <div>
                    <p className="text-[10px] font-bold uppercase opacity-70">
                        Comissão Implantação ({seller.commissionImplementation}%)
                    </p>
                    <p className="text-2xl font-black">
                        R$ {commissionImp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase opacity-70">
                        Comissão Mensal Recorrente ({seller.commissionMonthly}%)
                    </p>
                    <p className="text-2xl font-black">
                        R$ {commissionMon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="pt-4 border-t border-white/20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                            {seller.name[0]}
                        </div>
                        <div className="text-xs font-bold">{seller.name}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
