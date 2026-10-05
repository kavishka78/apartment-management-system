import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFacilities,
  createFacility,
  getActiveVisitors,
  checkInVisitor,
  deleteParkingSlot
} from '../services/api.js';

describe('API Service Integration & Error State Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── API Integration Tests (Success Flow) ───────────────────
  it('getFacilities - successfully fetches facility list from API endpoint', async () => {
    const mockFacilities = [
      { id: 1, name: 'Swimming Pool', capacity: 20, isActive: true },
      { id: 2, name: 'Gym', capacity: 15, isActive: true }
    ];

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockFacilities))
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await getFacilities();

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:5073/api/facilities',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Swimming Pool');
  });

  it('createFacility - successfully sends POST payload and receives created facility', async () => {
    const newFacility = { name: 'Tennis Court', capacity: 4 };
    const createdResponse = { id: 10, ...newFacility, isActive: true };

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(createdResponse))
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await createFacility(newFacility);

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:5073/api/facilities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newFacility)
      })
    );
    expect(result.id).toBe(10);
  });

  // ─── Error-State Tests (HTTP & Network Failures) ─────────────
  it('getFacilities - handles HTTP 500 Internal Server Error correctly', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Database connection failed')
    });
    vi.stubGlobal('fetch', fetchSpy);

    await expect(getFacilities()).rejects.toThrow('Database connection failed');
  });

  it('checkInVisitor - handles HTTP 401 Unauthorized Error for invalid access code', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid access code.')
    });
    vi.stubGlobal('fetch', fetchSpy);

    await expect(checkInVisitor(1, 'WRONG_CODE')).rejects.toThrow('Invalid access code.');
  });

  it('deleteParkingSlot - handles HTTP 400 Bad Request when deleting occupied slot', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Cannot delete an occupied parking slot.')
    });
    vi.stubGlobal('fetch', fetchSpy);

    await expect(deleteParkingSlot(5)).rejects.toThrow('Cannot delete an occupied parking slot.');
  });

  it('handles Network Failure / Disconnection gracefully', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchSpy);

    await expect(getActiveVisitors()).rejects.toThrow('Failed to fetch');
  });
});
