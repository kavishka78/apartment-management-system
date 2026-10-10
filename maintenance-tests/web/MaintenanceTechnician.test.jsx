import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import WorkOrders from '../../web/apartment-management-web/src/pages/maintenance/WorkOrders.jsx';
import TechnicianDashboard from '../../web/apartment-management-web/src/pages/technician/TechnicianDashboard.jsx';

const testState = vi.hoisted(() => ({
  currentUser: {
    name: 'Alex Technician',
    email: 'alex@example.com',
    phone: '+94710000000',
    role: 'Technician',
  },
  logout: vi.fn(),
}));

vi.mock('../../web/apartment-management-web/src/hooks/useIsMobile', () => ({ default: () => true }));
vi.mock('../../web/apartment-management-web/src/components/maintenance/MaintenanceSidebar', () => ({ default: () => null }));
vi.mock('../../web/apartment-management-web/src/pages/technician/TechnicianProfileDrawer', () => ({ default: () => null }));
vi.mock('../../web/apartment-management-web/src/context/AuthContext', () => ({ useAuth: () => testState }));

function RouteLocation() {
  const { pathname } = useLocation();
  return <span data-testid="route-location" data-path={pathname} />;
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/technician']}>
      <RouteLocation />
      <TechnicianDashboard />
    </MemoryRouter>,
  );
}

const orders = [
  {
    id: 41,
    title: 'Kitchen sink leak',
    description: 'Water is leaking below the sink.',
    status: 'Assigned',
    priority: 'High',
    createdAt: '2026-10-05T09:00:00Z',
    residentId: 12,
    technician: { name: 'Alex Technician', contactInformation: '+94710000000' },
    category: { name: 'Plumbing' },
  },
  {
    id: 42,
    title: 'Bathroom fan repair',
    description: 'The bathroom ventilation fan has stopped working.',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: '2026-10-04T09:00:00Z',
    residentId: 13,
    technician: { name: 'Alex Technician', contactInformation: '+94710000000' },
    category: { name: 'Electrical' },
  },
  {
    id: 43,
    title: 'Other technician job',
    description: 'Assigned to another technician.',
    status: 'Assigned',
    priority: 'Urgent',
    createdAt: '2026-10-06T09:00:00Z',
    residentId: 14,
    technician: { name: 'Taylor Technician', contactInformation: '+94719999999' },
    category: { name: 'Electrical' },
  },
];

const responseWithJson = (data) => ({
  ok: true,
  json: async () => data,
});

const installFetchMock = (data = orders) => {
  const fetchMock = vi.fn(async (url) => {
    const requestUrl = String(url);
    if (requestUrl.endsWith('/api/technicians')) return responseWithJson([]);
    if (requestUrl.endsWith('/api/maintenance')) return responseWithJson(data);
    if (requestUrl.endsWith('/start') || requestUrl.endsWith('/resolve')) {
      return responseWithJson({});
    }
    throw new Error(`Unexpected request: ${requestUrl}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('Maintenance and technician workflows', () => {
  beforeEach(() => {
    testState.currentUser = {
      name: 'Alex Technician',
      email: 'alex@example.com',
      phone: '+94710000000',
      role: 'Technician',
    };
    window.localStorage.setItem('ah_token', 'test-technician-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.innerWidth = 1024;
  });

  it('shows assigned work orders and excludes requests not yet assigned', async () => {
    installFetchMock([
      ...orders.slice(0, 2),
      { ...orders[0], id: 44, title: 'Awaiting triage', status: 'Pending' },
    ]);

    render(<WorkOrders />);

    expect(await screen.findByText('Kitchen sink leak')).toBeInTheDocument();
    expect(screen.getByText('Bathroom fan repair')).toBeInTheDocument();
    expect(screen.queryByText('Awaiting triage')).not.toBeInTheDocument();
  });

  it('redirects non-technician accounts to login without requesting work orders', async () => {
    testState.currentUser = {
      name: 'Resident User',
      email: 'resident@example.com',
      phone: '+94711111111',
      role: 'Resident',
    };
    const fetchMock = installFetchMock();

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('route-location')).toHaveAttribute('data-path', '/login');
    });
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/api/maintenance'))).toBe(false);
  });

  it('shows the empty state when the technician has no assigned jobs', async () => {
    installFetchMock([]);

    renderDashboard();

    expect(await screen.findByText('No work orders found.')).toBeInTheDocument();
  });

  it('limits technicians to their own jobs and filters work orders from the mobile dropdown', async () => {
    installFetchMock();
    window.innerWidth = 375;

    const { container } = renderDashboard();
    const workOrderList = container.querySelector('.compact-list');

    await waitFor(() => {
      expect(within(workOrderList).getByText('Kitchen sink leak')).toBeInTheDocument();
    });
    expect(within(workOrderList).getByText('Bathroom fan repair')).toBeInTheDocument();
    expect(within(workOrderList).queryByText('Other technician job')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('All Status', { exact: true }));
    const dropdown = container.querySelector('.dropdown-menu');
    expect(within(dropdown).getByText('In Progress', { exact: true })).toBeInTheDocument();

    fireEvent.click(within(dropdown).getByText('In Progress', { exact: true }));

    await waitFor(() => {
      expect(within(workOrderList).queryByText('Kitchen sink leak')).not.toBeInTheDocument();
      expect(within(workOrderList).getByText('Bathroom fan repair')).toBeInTheDocument();
    });
  });

  it('starts an assigned repair with the technician authorization token', async () => {
    const fetchMock = installFetchMock();
    const { container } = renderDashboard();
    const workOrderList = container.querySelector('.compact-list');

    await waitFor(() => {
      expect(within(workOrderList).getByText('Kitchen sink leak')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Start Repair/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5073/api/maintenance/41/start',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-technician-token',
          }),
        }),
      );
    });
    expect(container.querySelector('.details-view')).toBeInTheDocument();
  });

  it('submits a resolution note and repair cost for an in-progress job', async () => {
    const fetchMock = installFetchMock();
    const { container } = renderDashboard();
    const workOrderList = container.querySelector('.compact-list');

    await waitFor(() => {
      expect(within(workOrderList).getByText('Bathroom fan repair')).toBeInTheDocument();
    });
    fireEvent.click(within(workOrderList).getByText('Bathroom fan repair'));
    fireEvent.click(screen.getByRole('button', { name: /Mark Resolved/i }));
    fireEvent.change(screen.getByPlaceholderText('Resolution notes...'), {
      target: { value: 'Replaced the faulty fan motor.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repair cost in Rs.'), {
      target: { value: '3500' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      const resolutionRequest = fetchMock.mock.calls.find(([url]) =>
        String(url).endsWith('/api/maintenance/42/resolve'),
      );
      expect(resolutionRequest).toBeDefined();
      expect(JSON.parse(resolutionRequest[1].body)).toEqual({
        note: 'Replaced the faulty fan motor.',
        repairCost: 3500,
      });
    });
  });
});
