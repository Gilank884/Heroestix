import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Info,
    Calendar,
    MapPin,
    Share2,
    Globe,
    Edit,
    Clock,
    CheckCircle2,
    Tag
} from 'lucide-react';
import { getCategoryName, getSubCategoryName } from '../../constants/categories';
import VerificationPending from '../components/VerificationPending';
import TaxManagementSection from '../components/event-detail/TaxManagementSection';
import DateTimeLocationManagement from '../components/event-detail/DateTimeLocationManagement';
import GeneralInfoManagement from '../components/event-detail/GeneralInfoManagement';

const EventDetail = () => {
    const { id: eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(true);
    const [activeTab, setActiveTab] = useState('Informasi Umum');

    const tabs = [
        "Informasi Umum",
        "Tanggal Dan Lokasi",
        "Pajak Hiburan"
    ];

    useEffect(() => {
        const fetchEvent = async () => {
            if (eventId) {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (!error && data) {
                    setEvent(data);
                }

                // Check Verification
                const { data: creatorData } = await supabase
                    .from('creators')
                    .select('verified')
                    .eq('id', data?.creator_id || '')
                    .single();

                setIsVerified(creatorData?.verified ?? false);

                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    if (loading) return <div className="p-10 text-center font-bold">Loading...</div>;
    if (!isVerified) return <VerificationPending />;
    if (!event) return <div className="p-10 text-center text-red-500 font-bold">Event not found</div>;

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            {/* Page Title */}
            <h1 className="text-lg font-black text-gray-900">Detail Event</h1>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[11px] font-bold transition-all relative
                            ${activeTab === tab ? 'text-[#1a36c7]' : 'text-gray-400 hover:text-gray-600'}
                        `}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1a36c7]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Dynamic Content */}
            <div className="space-y-6">
                {/* General Info Tab */}
                {activeTab === 'Informasi Umum' && (
                    <GeneralInfoManagement
                        eventId={eventId}
                        eventData={event}
                        onUpdate={() => {
                            const fetchEvent = async () => {
                                const { data } = await supabase
                                    .from('events')
                                    .select('*')
                                    .eq('id', eventId)
                                    .single();
                                if (data) setEvent(data);
                            };
                            fetchEvent();
                        }}
                    />
                )}

                {/* Date & Location Tab */}
                {activeTab === 'Tanggal Dan Lokasi' && (
                    <DateTimeLocationManagement
                        eventId={eventId}
                        eventData={event}
                        onUpdate={() => {
                            // Re-fetch event data to reflect changes in other tabs if needed
                            const fetchEvent = async () => {
                                const { data } = await supabase
                                    .from('events')
                                    .select('*')
                                    .eq('id', eventId)
                                    .single();
                                if (data) setEvent(data);
                            };
                            fetchEvent();
                        }}
                    />
                )}

                {/* Tax Tab */}
                {activeTab === 'Pajak Hiburan' && (
                    <TaxManagementSection eventId={eventId} />
                )}
            </div>
        </div >
    );
};

export default EventDetail;
