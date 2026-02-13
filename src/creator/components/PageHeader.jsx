import React from 'react';

const PageHeader = ({ title, highlight, subtitle, icon: Icon, children }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    {Icon && <Icon size={20} className="text-[#1a36c7]" />}
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {title} <span className="text-[#1a36c7]">{highlight}</span>
                    </h1>
                </div>
                <p className="text-slate-500 font-medium text-sm">{subtitle}</p>
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
