import { api, isLoggedIn } from './api';

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});

test('a rejected session clears credentials and is not sent again', async () => {
  window.history.replaceState({}, '', '/login');
  localStorage.setItem('token', 'obsolete-token');
  localStorage.setItem('userId', 'obsolete-user');
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValueOnce({ status: 401 });
  await expect(api('/users/me')).rejects.toThrow('Please log in again');
  expect(isLoggedIn()).toBe(false);
  expect(localStorage.getItem('userId')).toBeNull();
  fetchMock.mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ events: [] }) });
  await api('/events/discover');
  expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
});
