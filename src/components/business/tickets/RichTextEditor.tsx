'use client';

import React, { useRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    readOnly?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    value, 
    onChange, 
    placeholder, 
    label, 
    className = "", 
    readOnly = false 
}) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const execCommand = (command: string, val: string = '') => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, val);
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editorRef.current) {
            const reader = new FileReader();
            reader.onload = (event) => {
                editorRef.current?.focus();
                const imgTag = `<img src="${event.target?.result}" class="max-w-full rounded-xl my-4 shadow-md border border-slate-200 dark:border-slate-700 block mx-auto" style="max-height: 400px;" />`;
                document.execCommand('insertHTML', false, imgTag);
                onChange(editorRef.current?.innerHTML || '');
            };
            reader.readAsDataURL(file);
        }
    };

    // Sincronizar valor externo com o editor apenas se for diferente
    React.useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    return (
        <div className={`space-y-3 ${className}`}>
            {label && <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">{label}</label>}
            
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 overflow-hidden flex flex-col focus-within:ring-4 focus-within:ring-primary/10 transition-all h-full">
                {/* Toolbar */}
                <div className="flex items-center flex-wrap gap-1 p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-0.5">
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('bold')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">format_bold</span>
                        </button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('italic')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">format_italic</span>
                        </button>
                    </div>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { const url = prompt("URL:"); if (url) execCommand('createLink', url); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">link</span>
                    </button>

                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('insertUnorderedList')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                    </button>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <label className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-1">
                        <span className="material-symbols-outlined text-[20px]">image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>

                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('removeFormat')} className="p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded text-slate-400 ml-auto">
                        <span className="material-symbols-outlined text-[20px]">format_clear</span>
                    </button>
                </div>

                {/* Editable Area */}
                <div
                    ref={editorRef}
                    contentEditable={!readOnly}
                    onInput={(e) => onChange(e.currentTarget.innerHTML)}
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                    className="w-full p-6 min-h-[200px] flex-1 text-base text-slate-700 dark:text-slate-300 outline-none overflow-y-auto bg-transparent prose prose-slate dark:prose-invert max-w-none custom-scrollbar"
                ></div>
            </div>
            
            <style jsx>{`
                [contenteditable]:empty:before {
                    content: "${placeholder || ''}";
                    color: #94a3b8;
                    font-style: italic;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};
