import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import Facilities from '../pages/admin/Facilities.jsx';
import * as api from '../services/api.js';

describe('Facilities Component API Integration & Error State Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('API Integration: Loads and displays facilities list from API', async () => {
    const mockFacilities = [
      { id: 1, name: 'Swimming Pool', description: 'Outdoor pool', capacity: 20, openTime: '06:00:00', closeTime: '22:00:00', isActive: true },
      { id: 2, name: 'Gym', description: 'Fitness center', capacity: 15, openTime: '05:00:00', closeTime: '23:00:00', isActive: false, deactivationReason: 'Under maintenance' }
    ];

    vi.spyOn(api, 'getFacilities').mockResolvedValue(mockFacilities);
    vi.spyOn(api, 'getBookings').mockResolvedValue([]);

    render(<Facilities />);

    await waitFor(() => {
      expect(screen.getByText('Swimming Pool')).toBeInTheDocument();
    });

    expect(screen.getByText('Gym')).toBeInTheDocument();
    expect(screen.getByText('Reason: Under maintenance')).toBeInTheDocument();
  });

  it('API Integration: Submits new facility via modal form and triggers API create', async () => {
    vi.spyOn(api, 'getFacilities').mockResolvedValue([]);
    vi.spyOn(api, 'getBookings').mockResolvedValue([]);
    const createSpy = vi.spyOn(api, 'createFacility').mockResolvedValue({ id: 10, name: 'Tennis Court' });

    render(<Facilities />);

    await waitFor(() => {
      expect(screen.getByText(/No facilities found/i)).toBeInTheDocument();
    });

    // Open Add Facility Modal
    fireEvent.click(screen.getByRole('button', { name: /Add Facility/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Facility Name/i), { target: { value: 'Tennis Court' } });
    fireEvent.change(screen.getByLabelText(/Capacity/i), { target: { value: '4' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Tennis Court',
        capacity: 4
      }));
    });
  });

  it('Error State: Displays alert when API creation fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(api, 'getFacilities').mockResolvedValue([]);
    vi.spyOn(api, 'getBookings').mockResolvedValue([]);
    vi.spyOn(api, 'createFacility').mockRejectedValue(new Error('Server error: Duplicate facility name'));

    render(<Facilities />);

    await waitFor(() => {
      expect(screen.getByText(/No facilities found/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Facility/i }));
    fireEvent.change(screen.getByLabelText(/Facility Name/i), { target: { value: 'Tennis Court' } });
    fireEvent.change(screen.getByLabelText(/Capacity/i), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error: Server error: Duplicate facility name');
    });
  });
});
