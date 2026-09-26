import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import Overview from '../pages/admin/Overview.jsx';
import * as api from '../services/api.js';

// Mock Recharts ResponsiveContainer to avoid SVG width/height measurement issues in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div>{children}</div>
  };
});

describe('Overview Component API Integration & Error State Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading spinner initially before API responds', () => {
    vi.spyOn(api, 'getDashboardStats').mockImplementation(() => new Promise(() => {}));
    vi.spyOn(api, 'getPendingWorkflows').mockImplementation(() => new Promise(() => {}));

    const { container } = render(<Overview />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('API Integration: Renders dashboard KPI metrics after successful API fetch', async () => {
    const mockStats = {
      activeFacilities: 5,
      currentVisitors: 3,
      totalVisitors: 10,
      visitorsWithParking: 2,
      totalBookings: 8,
      facilities: [{ id: 1, name: 'Gym', capacity: 20 }],
      visitors: [],
      bookings: [
        { id: 101, facilityName: 'Gym', residentId: 12, bookingDate: '2026-09-26', startTime: '10:00:00', endTime: '11:00:00' }
      ]
    };

    vi.spyOn(api, 'getDashboardStats').mockResolvedValue(mockStats);
    vi.spyOn(api, 'getPendingWorkflows').mockResolvedValue([{ id: 1, title: 'Approve Maintenance' }]);

    render(<Overview />);

    // Wait for loading to finish and KPI values to display
    await waitFor(() => {
      expect(screen.getByText('Active Facilities')).toBeInTheDocument();
    });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending AI workflows count
    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Resident #12')).toBeInTheDocument();
  });

  it('Error State: Renders error banner when API fails to load data', async () => {
    vi.spyOn(api, 'getDashboardStats').mockRejectedValue(new Error('Failed to connect to API server'));
    vi.spyOn(api, 'getPendingWorkflows').mockResolvedValue([]);

    render(<Overview />);

    await waitFor(() => {
      expect(screen.getByText(/Some data failed to load: Failed to connect to API server/i)).toBeInTheDocument();
    });
  });
});
