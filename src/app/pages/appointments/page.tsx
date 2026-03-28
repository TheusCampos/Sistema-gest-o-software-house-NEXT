'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { Appointment } from '@/types';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function AppointmentsPage() {
    const { appointments, fetchAppointments, saveAppointment, removeAppointment, tickets, fetchTickets } = useApp();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);


    // Filters
    const [filterSync, setFilterSync] = useState(true);
    const [filterDeploy, setFilterDeploy] = useState(true);
    const [filterTask, setFilterTask] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<Appointment>>({
        title: '',
        date: '',
        durationHours: 1,
        type: 'Remoto',
        status: 'Pendente',
        location: '',
        description: '',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
    });

    useEffect(() => {
        fetchAppointments();
        fetchTickets();
    }, [fetchAppointments, fetchTickets]);

    // Calcular dias da semana atual
    const weekDays = useMemo(() => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay()); // Volta para domingo

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const monthDays = useMemo(() => {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = [];
        const startDay = start.getDay();
        for (let i = startDay - 1; i >= 0; i--) {
            const d = new Date(start);
            d.setDate(d.getDate() - i - 1);
            days.push(d);
        }
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        for (let i = 1; i <= end.getDate(); i++) {
            days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        }
        const endDay = end.getDay();
        for (let i = 1; i <= 6 - endDay; i++) {
            const d = new Date(end);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentDate]);

    const navigateCalendar = (dir: number) => {
        setCurrentDate(prev => {
            const next = new Date(prev);
            if (viewMode === 'Month') {
                next.setMonth(next.getMonth() + dir);
            } else if (viewMode === 'Week') {
                next.setDate(next.getDate() + (dir * 7));
            } else {
                next.setDate(next.getDate() + dir);
            }
            return next;
        });
    };

    const navigateToday = () => {
        setCurrentDate(new Date());
    };

    // Abre o formulário ao clicar em um espaço vazio
    const handleSlotClick = (day: Date, hour: number) => {
        const d = new Date(day);
        d.setHours(hour, 0, 0, 0);

        // Bloqueio de Agendamento Retroativo (Somente ao Criar Novo)
        const now = new Date();
        // Permite agendar no mesmo dia desde que não seja hora muito velha, ou dias futuros
        if (d < now && (d.getDate() !== now.getDate() || d.getMonth() !== now.getMonth() || hour < now.getHours())) {
            setShowErrorModal(true);
            return;
        }


        setFormData({
            title: '',
            date: d.toISOString(),
            durationHours: 1,
            type: 'Remoto',
            status: 'Pendente',
            location: '',
            description: '',
            color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            id: undefined, // LIMPAR O ID AQUI
            ticketId: undefined, // LIMPAR TICKET
        });
        setIsAddModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.title || !formData.date) return;
        saveAppointment(formData);
        setIsAddModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja apagar este agendamento?')) {
            removeAppointment(id);
            setIsAddModalOpen(false);
        }
    };

    const handleEdit = (app: Appointment) => {
        setFormData(app);
        setIsAddModalOpen(true);
    };

    // Pega eventos filtrando pelo dia e semana atual
    const getEventsForDay = (day: Date) => {
        return appointments.filter(a => {
            if (a.active === false) return false;

            const color = a.color || '';
            if (!filterSync && color.includes('blue')) return false;
            if (!filterDeploy && color.includes('emerald')) return false;
            if (!filterTask && color.includes('purple')) return false;

            const aDate = new Date(a.date);
            return aDate.getFullYear() === day.getFullYear() &&
                aDate.getMonth() === day.getMonth() &&
                aDate.getDate() === day.getDate();
        });
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm animate-fadeIn">

            {/* TOP HEADER */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white capitalize">
                        {monthName} {year}
                    </h1>
                    <div className="flex items-center gap-2">
                        <button onClick={navigateToday} className="px-3 md:px-4 py-1.5 text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            Hoje
                        </button>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button onClick={() => navigateCalendar(-1)} className="p-1 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <button onClick={() => navigateCalendar(1)} className="p-1 rounded-md text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <button className="hover:text-primary transition" title="Buscar Agendamentos"><span className="material-symbols-outlined">search</span></button>
                    </div>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
                        {['Day', 'Week', 'Month'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode as 'Day' | 'Week' | 'Month')}
                                className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${viewMode === mode ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {mode === 'Day' ? 'Dia' : mode === 'Week' ? 'Semana' : 'Mês'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDEBAR (Mini calendar & Categories) */}
                <aside className="w-64 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 hidden lg:flex">
                    <button onClick={() => {
                        setFormData({ title: '', date: new Date().toISOString(), durationHours: 1, color: 'bg-primary/20 text-primary border-primary/30', type: 'Remoto', status: 'Pendente', location: '', description: '', id: undefined });
                        setIsAddModalOpen(true);
                    }} className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white p-3 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95">
                        <span className="material-symbols-outlined">add</span>
                        Novo Agendamento
                    </button>

                    <div>
                        <div className="flex items-center w-full justify-between mb-4">
                            <h2 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                                {new Date(currentDate).toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                            </h2>
                            <div className="flex gap-1">
                                <span onClick={() => { setViewMode('Month'); navigateCalendar(-1); }} className="material-symbols-outlined text-[18px] text-slate-400 cursor-pointer hover:text-primary transition bg-slate-100 dark:bg-slate-800 p-0.5 rounded">chevron_left</span>
                                <span onClick={() => { setViewMode('Month'); navigateCalendar(1); }} className="material-symbols-outlined text-[18px] text-slate-400 cursor-pointer hover:text-primary transition bg-slate-100 dark:bg-slate-800 p-0.5 rounded">chevron_right</span>
                            </div>
                        </div>
                        {/* Mini Calendar Real */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                            <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                            {monthDays.map((md, i) => {
                                const isCurrentSideMonth = md.getMonth() === currentDate.getMonth();
                                const isToday = md.getDate() === new Date().getDate() && md.getMonth() === new Date().getMonth() && md.getFullYear() === new Date().getFullYear();
                                return (
                                    <div
                                        key={i}
                                        onClick={() => { setViewMode('Day'); setCurrentDate(md); }}
                                        className={`p-1.5 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center 
                                        ${isCurrentSideMonth ? '' : 'text-slate-300 dark:text-slate-600'}
                                        ${isToday ? 'bg-primary text-white font-bold hover:bg-primary' : ''}`}
                                    >
                                        {md.getDate()}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">Minhas Agendas <span className="material-symbols-outlined text-[16px]">expand_more</span></h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                                <input type="checkbox" checked={filterSync} onChange={(e) => setFilterSync(e.target.checked)} className="w-4 h-4 rounded text-blue-500 border-slate-300 focus:ring-blue-500" />
                                <span className="group-hover:text-primary transition">Sincronização Diária</span>
                            </label>
                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                                <input type="checkbox" checked={filterDeploy} onChange={(e) => setFilterDeploy(e.target.checked)} className="w-4 h-4 rounded text-emerald-500 border-slate-300 focus:ring-emerald-500" />
                                <span className="group-hover:text-primary transition">Implantações</span>
                            </label>
                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer group">
                                <input type="checkbox" checked={filterTask} onChange={(e) => setFilterTask(e.target.checked)} className="w-4 h-4 rounded text-purple-500 border-slate-300 focus:ring-purple-500" />
                                <span className="group-hover:text-primary transition">Tarefas Internas</span>
                            </label>
                        </div>
                    </div>
                </aside>

                {/* INTERACTIVE CALENDAR GRIDS */}
                <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-slate-900">

                    {viewMode === 'Month' && (
                        <div className="flex flex-col h-full w-full">
                            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950">
                                {DAYS_OF_WEEK.map((dayName, i) => (
                                    <div key={i} className="py-3 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 last:border-none">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">{dayName}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-auto bg-slate-100 dark:bg-slate-800 gap-[1px]">
                                {monthDays.map((day, idx) => {
                                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                    const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() && day.getFullYear() === new Date().getFullYear();
                                    const dayEvents = getEventsForDay(day);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleSlotClick(day, 9)}
                                            className={`bg-white dark:bg-slate-900 p-2 flex flex-col gap-1 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition ${isCurrentMonth ? '' : 'opacity-50'}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {day.getDate()}
                                                </span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                                {dayEvents.map(event => (
                                                    <div key={event.id} onClick={(e) => { e.stopPropagation(); handleEdit(event); }} className={`p-1.5 rounded text-[10px] font-bold leading-tight truncate cursor-pointer hover:opacity-80 transition ${event.color || 'bg-slate-100 text-slate-700'}`}>
                                                        {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(viewMode === 'Week' || viewMode === 'Day') && (
                        <div className="flex-1 overflow-auto relative custom-scrollbar">
                            <div className={`${viewMode === 'Day' ? 'min-w-[300px]' : 'min-w-[700px]'}`}>
                                {/* Week/Day Header - Sticky */}
                                <div className={`sticky top-0 z-30 grid ${viewMode === 'Day' ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_repeat(7,minmax(0,1fr))]'} border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950`}>
                                    {/* Time empty slot */}
                                    <div className="border-r border-slate-100 dark:border-slate-800 flex items-end justify-center pb-2 shrink-0 px-2 text-center bg-white dark:bg-slate-950">
                                        <span className="text-[9px] font-black text-slate-400 uppercase leading-tight">CUIABÁ<br />(MT)</span>
                                    </div>
                                    {/* Days */}
                                    {(viewMode === 'Day' ? [currentDate] : weekDays).map((day, i) => {
                                        const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() && day.getFullYear() === new Date().getFullYear();
                                        return (
                                            <div key={i} className="py-4 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 last:border-none bg-white dark:bg-slate-950">
                                                <span className={`text-xs font-black uppercase tracking-widest mb-1 ${isToday ? 'text-primary' : 'text-slate-500'}`}>
                                                    {DAYS_OF_WEEK[day.getDay()]} {day.getDate()}
                                                </span>
                                                {isToday && <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold shadow-lg mt-1">{day.getDate()}</div>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Week/Day Grid Scrollable */}
                                <div className={`grid ${viewMode === 'Day' ? 'grid-cols-[80px_1fr]' : 'grid-cols-[80px_repeat(7,minmax(0,1fr))]'} relative`}>

                                    {/* Time Column */}
                                    <div className="border-r border-slate-100 dark:border-slate-800 shrink-0">
                                        {HOURS.map(hour => (
                                            <div key={hour} className="h-20 flex px-2 relative border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 -mt-2.5 bg-white dark:bg-slate-900 px-1 absolute right-2">
                                                    {hour.toString().padStart(2, '0')}:00
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Days Columns */}
                                    {(viewMode === 'Day' ? [currentDate] : weekDays).map((day, dayIdx) => (
                                        <div key={dayIdx} className="border-r border-slate-100 dark:border-slate-800 relative">
                                            {/* Grid Rows */}
                                            {HOURS.map(hour => (
                                                <div
                                                    key={hour}
                                                    onClick={() => handleSlotClick(day, hour)}
                                                    className="h-20 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                                                ></div>
                                            ))}

                                            {/* Events Rendered Absolutely */}
                                            {getEventsForDay(day).map(event => {
                                                const eventDate = new Date(event.date);
                                                const startHour = eventDate.getHours();
                                                const startMin = eventDate.getMinutes();
                                                // Ensure the event falls in our visible range
                                                if (startHour < HOURS[0] || startHour > HOURS[HOURS.length - 1]) return null;

                                                const topPosition = ((startHour - HOURS[0]) * 80) + ((startMin / 60) * 80);
                                                const heightPx = event.durationHours * 80;

                                                return (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                                                        className={`absolute left-1 right-1 rounded-xl p-2 border shadow-sm cursor-pointer hover:shadow-md transition-shadow group overflow-hidden ${event.color || 'bg-slate-100 border-slate-200'}`}
                                                        style={{ top: `${topPosition}px`, height: `${heightPx}px`, zIndex: 10 }}
                                                    >
                                                        <p className="text-xs font-bold leading-tight truncate">{event.title}</p>
                                                        <p className="text-[10px] opacity-70 mt-0.5 truncate flex items-center gap-1">
                                                            {startHour.toString().padStart(2, '0')}:{startMin.toString().padStart(2, '0')}
                                                            {event.location && <span className="material-symbols-outlined text-[10px]">videocam</span>}
                                                        </p>
                                                        {heightPx > 60 && (
                                                            <p className="text-[10px] mt-1 opacity-90 truncate font-medium">{event.clientName}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FLOATING ACTION MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center lg:items-end lg:justify-end lg:pr-12 lg:pb-12 bg-slate-900/20 backdrop-blur-sm animate-fadeIn p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-[400px] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-dropIn">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <h3 className="font-black text-slate-800 dark:text-white">{formData.id ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <input
                                    className="w-full text-lg font-bold text-slate-800 dark:text-white bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 focus:ring-0 focus:border-primary px-0 py-2 placeholder-slate-300"
                                    placeholder="Adicionar título"
                                    value={formData.title || ''}
                                    autoFocus
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                                <input
                                    type="datetime-local"
                                    className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-bold"
                                    value={formData.date ? formData.date.slice(0, 16) : ''}
                                    onChange={e => {
                                        if (e.target.value) {
                                            const d = new Date(e.target.value);
                                            setFormData({ ...formData, date: d.toISOString() });
                                        }
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Duração (hs)</label>
                                    <input
                                        type="number" step="0.5"
                                        className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-bold h-6"
                                        value={formData.durationHours || ''}
                                        onChange={e => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status</label>
                                    <select
                                        className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-bold h-6 appearance-none"
                                        value={formData.status || ''}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as Appointment['status'] })}
                                    >
                                        <option>Pendente</option>
                                        <option>Confirmado</option>
                                        <option>Concluído</option>
                                        <option>Cancelado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <span className="material-symbols-outlined text-slate-400">person_add</span>
                                <input
                                    type="text"
                                    className="bg-transparent border-none p-0 focus:ring-0 w-full"
                                    placeholder="Adicionar cliente convidado"
                                    value={formData.clientName || ''}
                                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <span className="material-symbols-outlined text-slate-400">link</span>
                                <input
                                    type="text"
                                    className="bg-transparent border-none p-0 focus:ring-0 w-full text-blue-500 font-medium"
                                    placeholder="Adicionar link de vídeo ou local..."
                                    value={formData.location || ''}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <span className="material-symbols-outlined text-slate-400">confirmation_number</span>
                                <select
                                    className="bg-transparent border-none p-0 focus:ring-0 w-full font-medium appearance-none text-ellipsis overflow-hidden whitespace-nowrap"
                                    value={formData.ticketId || ''}
                                    onChange={e => setFormData({ ...formData, ticketId: e.target.value })}
                                >
                                    <option value="">(Opcional) Vincular a um Ticket Existent</option>
                                    {tickets?.filter(t => t.status !== 'Closed').map(t => {
                                        const displaySubject = t.subject.length > 20 ? t.subject.substring(0, 20) + '...' : t.subject;
                                        const displayClient = t.clientName.length > 15 ? t.clientName.substring(0, 15) + '...' : t.clientName;
                                        return (
                                            <option key={t.id} value={t.id}>
                                                [{t.id.slice(0, 6)}] {displaySubject} - {displayClient}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 h-20">
                                <span className="material-symbols-outlined text-slate-400 mt-1">notes</span>
                                <textarea
                                    className="bg-transparent border-none p-0 focus:ring-0 w-full resize-none text-sm h-full"
                                    placeholder="Adicionar descrição"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-2">
                                <button type="button" onClick={() => setFormData({ ...formData, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' })} className={`w-6 h-6 rounded-full bg-emerald-400 focus:ring-2 ring-offset-2 ring-emerald-400 ${formData.color?.includes('emerald') ? 'ring-2' : ''}`}></button>
                                <button type="button" onClick={() => setFormData({ ...formData, color: 'bg-blue-100 text-blue-800 border-blue-200' })} className={`w-6 h-6 rounded-full bg-blue-400 focus:ring-2 ring-offset-2 ring-blue-400 ${formData.color?.includes('blue') ? 'ring-2' : ''}`}></button>
                                <button type="button" onClick={() => setFormData({ ...formData, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' })} className={`w-6 h-6 rounded-full bg-indigo-400 focus:ring-2 ring-offset-2 ring-indigo-400 ${formData.color?.includes('indigo') ? 'ring-2' : ''}`}></button>
                                <button type="button" onClick={() => setFormData({ ...formData, color: 'bg-purple-100 text-purple-800 border-purple-200' })} className={`w-6 h-6 rounded-full bg-purple-400 focus:ring-2 ring-offset-2 ring-purple-400 ${formData.color?.includes('purple') ? 'ring-2' : ''}`}></button>
                                <button type="button" onClick={() => setFormData({ ...formData, color: 'bg-rose-100 text-rose-800 border-rose-200' })} className={`w-6 h-6 rounded-full bg-rose-400 focus:ring-2 ring-offset-2 ring-rose-400 ${formData.color?.includes('rose') ? 'ring-2' : ''}`}></button>
                            </div>

                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3">
                            {formData.id ? (
                                <button onClick={() => handleDelete(formData.id!)} className="px-4 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold text-sm transition mr-auto">Excluir</button>
                            ) : <div></div>}
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-bold text-sm transition">Cancelar</button>
                                <button onClick={handleSave} className="px-8 py-2.5 rounded-xl text-white bg-slate-900 dark:bg-primary hover:bg-slate-800 dark:hover:bg-blue-600 shadow-xl shadow-slate-900/10 font-bold text-sm transition active:scale-95 disabled:opacity-50" disabled={!formData.title}>Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR MODAL (Retroactive Restriction) */}
            {showErrorModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-[360px] rounded-[24px] shadow-2xl border border-rose-100 dark:border-rose-900 overflow-hidden animate-dropIn">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="material-symbols-outlined text-[32px]">event_busy</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Ação Bloqueada</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-sm">
                                Não é possível criar agendamentos <br /> em datas ou horários retroativos.
                            </p>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="w-full mt-2 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-xl hover:opacity-90 shadow-lg shadow-slate-900/10 transition active:scale-95"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
