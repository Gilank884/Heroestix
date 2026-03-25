import React from 'react';
import PlatformReport from './FormalReport/PlatformReport';
import EventAuditReport from './FormalReport/EventAuditReport';
import CreatorCashReport from './FormalReport/CreatorCashReport';
import CreatorSalesReport from './FormalReport/CreatorSalesReport';

/**
 * FormalReport - Centralized entry point for all financial PDF reports.
 * This component is now modularized to keep the main bundle lightweight.
 */
export default function FormalReport({ type, data, creatorInfo, eventData, metrics, paymentBreakdown }) {
    switch (type) {
        case 'platform': 
            return <PlatformReport data={data} metrics={metrics} />;
        
        case 'event_cash_dev': 
            return (
                <EventAuditReport 
                    eventData={eventData} 
                    creatorInfo={creatorInfo} 
                    metrics={metrics} 
                    paymentBreakdown={paymentBreakdown} 
                />
            );
        
        case 'event_cash_creator': 
            return (
                <CreatorCashReport 
                    data={data} 
                    creatorInfo={creatorInfo} 
                    eventData={eventData} 
                />
            );
        
        case 'sales_report_creator': 
            return (
                <CreatorSalesReport 
                    data={data} 
                    metrics={metrics} 
                    eventData={eventData} 
                    creatorInfo={creatorInfo} 
                />
            );
            
        default: 
            return null;
    }
}
