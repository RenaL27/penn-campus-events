import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Notifications from './Notifications';
import { api } from '../utils/api';
jest.mock('../utils/api', () => ({ api: jest.fn(), isLoggedIn: () => true }));
afterEach(() => { jest.clearAllMocks(); });
test('shows unread notifications and refreshes after marking all as read', async () => {
  let read = false;
  api.mockImplementation(async (path, method) => {
    if (path === '/notifications/unread') return { unread: read ? 0 : 1 };
    if (path === '/notifications/read-all' && method === 'PUT') { read = true; return null; }
    return { unread: read ? 0 : 1, pages: 1, items: [{ _id: 'notice', title: 'Registration confirmed', message: 'You are registered for Campus Jazz.', createdAt: '2026-10-08T12:00:00Z', readAt: read ? '2026-10-08T13:00:00Z' : null, href: '/events/event' }] };
  });
  render(<MemoryRouter><Notifications /></MemoryRouter>);
  expect(await screen.findByText('Registration confirmed')).toBeInTheDocument();
  expect(screen.getByText('1 unread')).toBeInTheDocument();
  userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
  await waitFor(() => expect(screen.getByText('0 unread')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
});
