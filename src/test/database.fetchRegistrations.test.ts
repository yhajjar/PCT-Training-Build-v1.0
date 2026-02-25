import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRegistrations } from '@/lib/database';
import { pb } from '@/integrations/pocketbase/client';

vi.mock('@/integrations/pocketbase/client', () => ({
  pb: {
    collection: vi.fn(),
  },
}));

interface MockDbRegistration {
  id: string;
  training_id: string;
  user_id: string | null;
  participant_name: string;
  participant_email: string;
  participant_phone: string | null;
  registered_at: string;
  status: string;
  attendance_status: string;
  notes: string | null;
  notified_at: string | null;
}

function makeDbRegistration(index: number): MockDbRegistration {
  return {
    id: `reg-${index}`,
    training_id: `training-${index % 5}`,
    user_id: null,
    participant_name: `Participant ${index}`,
    participant_email: `participant${index}@example.com`,
    participant_phone: null,
    registered_at: '2026-02-25T08:00:00.000Z',
    status: 'registered',
    attendance_status: 'pending',
    notes: null,
    notified_at: null,
  };
}

describe('fetchRegistrations', () => {
  const collectionMock = vi.mocked(pb.collection);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all records from getFullList when dataset exceeds 100', async () => {
    const service = {
      getFullList: vi.fn(),
      getList: vi.fn(),
    };
    const rows = Array.from({ length: 125 }, (_, i) => makeDbRegistration(i + 1));

    service.getFullList.mockResolvedValue(rows);
    collectionMock.mockReturnValue(service as any);

    const result = await fetchRegistrations();

    expect(collectionMock).toHaveBeenCalledWith('registrations');
    expect(service.getFullList).toHaveBeenCalledWith({ sort: '-registered_at' });
    expect(result).toHaveLength(125);
    expect(result[0].participantName).toBe('Participant 1');
    expect(result[0].status).toBe('registered');
    expect(result[0].attendanceStatus).toBe('pending');
    expect(result[0].registeredAt).toBeInstanceOf(Date);
  });

  it('falls back to paginated getList when getFullList fails', async () => {
    const service = {
      getFullList: vi.fn(),
      getList: vi.fn(),
    };
    const page1 = Array.from({ length: 110 }, (_, i) => makeDbRegistration(i + 1));
    const page2 = Array.from({ length: 15 }, (_, i) => makeDbRegistration(i + 111));

    service.getFullList.mockRejectedValue(new Error('full list unavailable'));
    service.getList
      .mockResolvedValueOnce({
        items: page1,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: page2,
        totalPages: 2,
      });

    collectionMock.mockReturnValue(service as any);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await fetchRegistrations();

    expect(service.getList).toHaveBeenCalledTimes(2);
    expect(service.getList).toHaveBeenNthCalledWith(1, 1, 200, { sort: '-registered_at' });
    expect(service.getList).toHaveBeenNthCalledWith(2, 2, 200, { sort: '-registered_at' });
    expect(result).toHaveLength(125);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('returns an empty array when both full-list and paginated fetch fail', async () => {
    const service = {
      getFullList: vi.fn(),
      getList: vi.fn(),
    };

    service.getFullList.mockRejectedValue(new Error('full list unavailable'));
    service.getList.mockRejectedValue(new Error('pagination failed'));

    collectionMock.mockReturnValue(service as any);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await fetchRegistrations();

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('Error fetching registrations:', expect.any(Error));

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
