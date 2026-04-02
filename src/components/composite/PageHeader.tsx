'use client';

import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}

/**
 * Header reutilizável de página de lista.
 * Pattern presente em sellers, service-types, users, appointments, etc.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
            <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium">
                        {subtitle}
                    </p>
                )}
            </div>
            {children && (
                <div className="shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
