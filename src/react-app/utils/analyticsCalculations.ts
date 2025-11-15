// Analytics calculation utilities
import { loadCampaigns, loadCRMData, getContactMessageHistory } from './storage';

export interface CampaignAnalytics {
  id: string;
  name: string;
  date: string;
  totalSent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  readRate: number;
  conversionRate: number;
}

export interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface HeatmapData {
  hour: number;
  day: string;
  value: number;
}

export interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
}

// Calculate analytics for all campaigns
export const calculateCampaignAnalytics = (): CampaignAnalytics[] => {
  const campaigns = loadCampaigns();

  return campaigns.map(campaign => {
    const totalSent = campaign.sent || 0;
    const totalContacts = campaign.contacts || 0;
    const failed = campaign.errors || 0;

    // For now, we estimate delivered and read based on typical rates
    // In a real scenario, this would come from message history
    const delivered = Math.floor(totalSent * 0.95); // 95% delivery rate
    const read = Math.floor(delivered * 0.6); // 60% read rate

    const deliveryRate = totalContacts > 0 ? (delivered / totalContacts) * 100 : 0;
    const readRate = delivered > 0 ? (read / delivered) * 100 : 0;
    const conversionRate = totalContacts > 0 ? (read / totalContacts) * 100 : 0;

    return {
      id: campaign.id,
      name: campaign.name,
      date: campaign.date,
      totalSent,
      delivered,
      read,
      failed,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      readRate: Math.round(readRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  });
};

// Get time series data (messages over time)
export const getTimeSeriesData = (dateRange?: { from: string; to: string }): TimeSeriesData[] => {
  const campaigns = loadCampaigns();

  // Group by date
  const dataByDate: { [key: string]: TimeSeriesData } = {};

  campaigns.forEach(campaign => {
    if (!campaign.date) return;

    const dateKey = campaign.date.split('T')[0]; // Get YYYY-MM-DD

    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = {
        date: dateKey,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      };
    }

    const sent = campaign.sent || 0;
    const failed = campaign.errors || 0;
    const delivered = Math.floor(sent * 0.95);
    const read = Math.floor(delivered * 0.6);

    dataByDate[dateKey].sent += sent;
    dataByDate[dateKey].delivered += delivered;
    dataByDate[dateKey].read += read;
    dataByDate[dateKey].failed += failed;
  });

  // Convert to array and sort by date
  return Object.values(dataByDate).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

// Get status distribution for pie chart
export const getStatusDistribution = (): StatusDistribution[] => {
  const campaigns = loadCampaigns();

  let totalSent = 0;
  let totalDelivered = 0;
  let totalRead = 0;
  let totalFailed = 0;

  campaigns.forEach(campaign => {
    const sent = campaign.sent || 0;
    const failed = campaign.errors || 0;
    const delivered = Math.floor(sent * 0.95);
    const read = Math.floor(delivered * 0.6);

    totalSent += sent;
    totalDelivered += delivered;
    totalRead += read;
    totalFailed += failed;
  });

  return [
    { name: 'Leídos', value: totalRead, color: '#8b5cf6' },
    { name: 'Entregados (sin leer)', value: totalDelivered - totalRead, color: '#10b981' },
    { name: 'Enviados (sin entregar)', value: totalSent - totalDelivered, color: '#3b82f6' },
    { name: 'Fallidos', value: totalFailed, color: '#ef4444' }
  ].filter(item => item.value > 0);
};

// Get funnel data (conversion funnel)
export const getFunnelData = (): FunnelStage[] => {
  const campaigns = loadCampaigns();

  let totalContacts = 0;
  let totalSent = 0;
  let totalDelivered = 0;
  let totalRead = 0;

  campaigns.forEach(campaign => {
    totalContacts += campaign.contacts || 0;
    const sent = campaign.sent || 0;
    totalSent += sent;
    totalDelivered += Math.floor(sent * 0.95);
    totalRead += Math.floor(sent * 0.95 * 0.6);
  });

  const stages = [
    { name: 'Total Contactos', value: totalContacts },
    { name: 'Mensajes Enviados', value: totalSent },
    { name: 'Entregados', value: totalDelivered },
    { name: 'Leídos', value: totalRead }
  ];

  // Calculate percentages based on total contacts
  return stages.map(stage => ({
    ...stage,
    percentage: totalContacts > 0 ? Math.round((stage.value / totalContacts) * 100) : 0
  }));
};

// Get heatmap data (best times to send)
export const getHeatmapData = (): HeatmapData[] => {
  // This would ideally come from actual message send times
  // For now, generate sample data based on typical patterns
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const heatmapData: HeatmapData[] = [];

  days.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      // Simulate higher engagement during business hours
      let value = 0;
      if (hour >= 9 && hour <= 18 && !['Sáb', 'Dom'].includes(day)) {
        value = Math.floor(Math.random() * 50) + 30; // 30-80 for business hours
      } else if (hour >= 9 && hour <= 18) {
        value = Math.floor(Math.random() * 30) + 10; // 10-40 for weekends
      } else {
        value = Math.floor(Math.random() * 20); // 0-20 for off-hours
      }

      heatmapData.push({ hour, day, value });
    }
  });

  return heatmapData;
};

// Get overall statistics
export const getOverallStats = () => {
  const campaigns = loadCampaigns();

  let totalCampaigns = campaigns.length;
  let totalContacts = 0;
  let totalSent = 0;
  let totalFailed = 0;
  let totalDelivered = 0;
  let totalRead = 0;

  campaigns.forEach(campaign => {
    totalContacts += campaign.contacts || 0;
    const sent = campaign.sent || 0;
    totalSent += sent;
    totalFailed += campaign.errors || 0;
    totalDelivered += Math.floor(sent * 0.95);
    totalRead += Math.floor(sent * 0.95 * 0.6);
  });

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;
  const successRate = totalSent > 0 ? ((totalSent - totalFailed) / totalSent) * 100 : 0;

  return {
    totalCampaigns,
    totalContacts,
    totalSent,
    totalDelivered,
    totalRead,
    totalFailed,
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    readRate: Math.round(readRate * 100) / 100,
    successRate: Math.round(successRate * 100) / 100,
    avgMessagesPerCampaign: totalCampaigns > 0 ? Math.round(totalSent / totalCampaigns) : 0
  };
};

// Compare periods (this week vs last week, etc.)
export const comparePeriods = (currentPeriod: { from: string; to: string }, previousPeriod: { from: string; to: string }) => {
  const campaigns = loadCampaigns();

  const getCurrentStats = () => {
    const filtered = campaigns.filter(c => {
      const date = new Date(c.date);
      return date >= new Date(currentPeriod.from) && date <= new Date(currentPeriod.to);
    });

    return {
      campaigns: filtered.length,
      sent: filtered.reduce((sum, c) => sum + (c.sent || 0), 0),
      contacts: filtered.reduce((sum, c) => sum + (c.contacts || 0), 0)
    };
  };

  const getPreviousStats = () => {
    const filtered = campaigns.filter(c => {
      const date = new Date(c.date);
      return date >= new Date(previousPeriod.from) && date <= new Date(previousPeriod.to);
    });

    return {
      campaigns: filtered.length,
      sent: filtered.reduce((sum, c) => sum + (c.sent || 0), 0),
      contacts: filtered.reduce((sum, c) => sum + (c.contacts || 0), 0)
    };
  };

  const current = getCurrentStats();
  const previous = getPreviousStats();

  const calculateChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    current,
    previous,
    changes: {
      campaigns: calculateChange(current.campaigns, previous.campaigns),
      sent: calculateChange(current.sent, previous.sent),
      contacts: calculateChange(current.contacts, previous.contacts)
    }
  };
};

// Get top performing campaigns
export const getTopCampaigns = (limit: number = 5) => {
  const analytics = calculateCampaignAnalytics();

  return analytics
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, limit);
};

// Get campaign performance over time
export const getCampaignPerformanceComparison = () => {
  const analytics = calculateCampaignAnalytics();

  return analytics.map(campaign => ({
    name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + '...' : campaign.name,
    enviados: campaign.totalSent,
    entregados: campaign.delivered,
    leídos: campaign.read,
    fallidos: campaign.failed
  }));
};
