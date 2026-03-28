'use client';

import React from 'react';

interface ContractMinutaProps {
    legalText: string;
    contractNumber: string;
    onEdit?: () => void;
    onReset?: () => void;
}

export const ContractMinuta: React.FC<ContractMinutaProps> = ({ legalText, contractNumber, onEdit, onReset }) => {
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Contrato ${contractNumber}</title>
                    <style>
                        @page { size: auto; margin: 2.5cm; }
                        body { 
                            font-family: "Times New Roman", Times, serif; 
                            padding: 0; 
                            line-height: 1.5; 
                            color: #000; 
                            background: white;
                            text-align: justify;
                        }
                        .contract-content { width: 100%; }
                        h1, h2, h3 { text-transform: uppercase; }
                        strong { font-weight: bold; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="contract-content">${legalText}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-slideUp">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Minuta do Contrato</span>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button 
                            onClick={onEdit} 
                            className="text-slate-400 text-[18px] material-symbols-outlined hover:text-primary transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            title="Editar Minuta"
                        >
                            edit
                        </button>
                    )}
                    {onReset && (
                        <button 
                            onClick={onReset} 
                            className="text-slate-400 text-[18px] material-symbols-outlined hover:text-red-500 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            title="Resetar para o Padrão"
                        >
                            restart_alt
                        </button>
                    )}
                    <button 
                        onClick={handlePrint} 
                        className="text-primary text-[18px] material-symbols-outlined hover:scale-110 transition-transform p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        title="Imprimir / PDF"
                    >
                        print
                    </button>
                </div>
            </div>
            <div className="p-5">
                <div 
                    className="text-[12px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar italic bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: legalText }}
                >
                </div>
                <p className="mt-4 text-[10px] text-slate-400 text-center">
                    Este texto é gerado dinamicamente com base nas informações do acordo.
                </p>
            </div>
        </div>
    );
};
