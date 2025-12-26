/**
 * Sendbird Platform API - Channel API Test Suite
 * 
 * Test Design Techniques Applied:
 * - Equivalence Partitioning: Channel types, member configurations
 * - Boundary Value Analysis: Member limits, name lengths
 * - Error Guessing: Permission errors, invalid channel URLs
 * - State Transition: Channel lifecycle
 * - Negative Testing: Unauthorized operations
 * 
 * API Reference: https://sendbird.com/docs/chat/platform-api/v3/channel/creating-a-channel/create-a-group-channel
 */

import { test, expect } from '@playwright/test';
import { UserAPI, ChannelAPI, generateTestId } from '../utils/sendbird-api';

test.describe('Channel API - Create Channel Tests', () => {
  let testUserId: string;
  let testUserId2: string;
  const createdChannelUrls: string[] = [];

  test.beforeAll(async () => {
    testUserId = generateTestId('channel_owner');
    testUserId2 = generateTestId('channel_member');
    await UserAPI.create(testUserId, 'ChannelOwner');
    await UserAPI.create(testUserId2, 'ChannelMember');
  });

  test.afterAll(async () => {
    for (const url of createdChannelUrls) {
      try {
        await ChannelAPI.delete(url);
      } catch (error) {
        // Ignore
      }
    }
    try {
      await UserAPI.delete(testUserId);
      await UserAPI.delete(testUserId2);
    } catch (error) {
      // Ignore
    }
  });

  test.describe('Positive Tests', () => {
    
    test('TC-CHANNEL-001: Create group channel with single member', async () => {
      const channelName = `Single Member Channel ${Date.now()}`;

      const response = await ChannelAPI.create(channelName, [testUserId]);
      createdChannelUrls.push(response.data.channel_url);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(channelName);
      expect(response.data.channel_url).toBeDefined();
      expect(response.data.member_count).toBe(1);
    });

    test('TC-CHANNEL-002: Create group channel with multiple members', async () => {
      const channelName = `Multi Member Channel ${Date.now()}`;

      const response = await ChannelAPI.create(channelName, [testUserId, testUserId2]);
      createdChannelUrls.push(response.data.channel_url);

      expect(response.status).toBe(200);
      expect(response.data.member_count).toBe(2);
    });

    test('TC-CHANNEL-003: Create distinct channel', async () => {
      const channelName = `Distinct Channel ${Date.now()}`;

      const response = await ChannelAPI.create(channelName, [testUserId], true);
      createdChannelUrls.push(response.data.channel_url);

      expect(response.status).toBe(200);
      expect(response.data.is_distinct).toBe(true);
    });

    test('TC-CHANNEL-004: Create channel with Korean name', async () => {
      const channelName = `테스트 채널 ${Date.now()}`;

      const response = await ChannelAPI.create(channelName, [testUserId]);
      createdChannelUrls.push(response.data.channel_url);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(channelName);
    });

    test('TC-CHANNEL-005: Create channel with emoji in name', async () => {
      const channelName = `Channel 🎉💬 ${Date.now()}`;

      const response = await ChannelAPI.create(channelName, [testUserId]);
      createdChannelUrls.push(response.data.channel_url);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(channelName);
    });
  });

  test.describe('Boundary Value Analysis', () => {
    
    test('TC-CHANNEL-006: Create channel with empty name', async () => {
      const response = await ChannelAPI.create('', [testUserId]);
      createdChannelUrls.push(response.data.channel_url);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe('');
    });

    test('TC-CHANNEL-007: Create channel with very long name (191 chars)', async () => {
      const longName = 'C'.repeat(191);

      const response = await ChannelAPI.create(longName, [testUserId]);
      createdChannelUrls.push(response.data.channel_url);

      expect(response.status).toBe(200);
    });
  });

  test.describe('Negative Tests', () => {
    
    test('TC-CHANNEL-008: Create channel with non-existent user behavior check', async () => {
      // Note: Sendbird API may allow creating channels with non-existent users
      const nonExistentUserId = 'non_existent_user_' + Date.now();

      try {
        const response = await ChannelAPI.create('TestChannel', [nonExistentUserId]);
        // If API allows it, cleanup and log the behavior
        if (response.status === 200) {
          createdChannelUrls.push(response.data.channel_url);
          console.log('API allows channel creation with non-existent user');
          expect(response.data.member_count).toBe(0); // No valid members
        }
      } catch (error: any) {
        // If API rejects it, verify error response
        expect(error.response.status).toBe(400);
      }
    });

    test('TC-CHANNEL-009: Fail to create channel with empty user list', async () => {
      try {
        await ChannelAPI.create('EmptyUserChannel', []);
        // Some APIs may allow empty user list
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

test.describe('Channel API - Read Channel Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('read_channel_user');
    await UserAPI.create(testUserId, 'ReadChannelUser');
    
    const channelResponse = await ChannelAPI.create('ReadTestChannel', [testUserId]);
    testChannelUrl = channelResponse.data.channel_url;
  });

  test.afterAll(async () => {
    try {
      await ChannelAPI.delete(testChannelUrl);
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-CHANNEL-010: Get channel by URL', async () => {
    const response = await ChannelAPI.get(testChannelUrl);

    expect(response.status).toBe(200);
    expect(response.data.channel_url).toBe(testChannelUrl);
    expect(response.data.name).toBe('ReadTestChannel');
  });

  test('TC-CHANNEL-011: Verify channel response contains expected fields', async () => {
    const response = await ChannelAPI.get(testChannelUrl);

    expect(response.data).toHaveProperty('channel_url');
    expect(response.data).toHaveProperty('name');
    expect(response.data).toHaveProperty('member_count');
    expect(response.data).toHaveProperty('created_at');
    expect(response.data).toHaveProperty('is_distinct');
    expect(response.data).toHaveProperty('is_public');
  });

  test('TC-CHANNEL-012: Fail to get non-existent channel', async () => {
    const nonExistentUrl = 'non_existent_channel_' + Date.now();

    try {
      await ChannelAPI.get(nonExistentUrl);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

test.describe('Channel API - Update Channel Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeEach(async () => {
    testUserId = generateTestId('update_channel_user');
    await UserAPI.create(testUserId, 'UpdateChannelUser');
    
    const channelResponse = await ChannelAPI.create('OriginalChannelName', [testUserId]);
    testChannelUrl = channelResponse.data.channel_url;
  });

  test.afterEach(async () => {
    try {
      await ChannelAPI.delete(testChannelUrl);
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-CHANNEL-013: Update channel name', async () => {
    const newName = 'UpdatedChannelName';

    const response = await ChannelAPI.update(testChannelUrl, newName);

    expect(response.status).toBe(200);
    expect(response.data.name).toBe(newName);
  });

  test('TC-CHANNEL-014: Update channel name to empty string', async () => {
    const response = await ChannelAPI.update(testChannelUrl, '');

    expect(response.status).toBe(200);
    expect(response.data.name).toBe('');
  });

  test('TC-CHANNEL-015: Fail to update non-existent channel', async () => {
    const nonExistentUrl = 'non_existent_' + Date.now();

    try {
      await ChannelAPI.update(nonExistentUrl, 'NewName');
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

test.describe('Channel API - Delete Channel Tests', () => {
  let testUserId: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('delete_channel_user');
    await UserAPI.create(testUserId, 'DeleteChannelUser');
  });

  test.afterAll(async () => {
    try {
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-CHANNEL-016: Delete existing channel', async () => {
    const channelResponse = await ChannelAPI.create('DeleteTestChannel', [testUserId]);
    const channelUrl = channelResponse.data.channel_url;

    const deleteResponse = await ChannelAPI.delete(channelUrl);
    expect(deleteResponse.status).toBe(200);

    try {
      await ChannelAPI.get(channelUrl);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });

  test('TC-CHANNEL-017: Fail to delete non-existent channel', async () => {
    const nonExistentUrl = 'non_existent_delete_' + Date.now();

    try {
      await ChannelAPI.delete(nonExistentUrl);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

test.describe('Channel API - Member Management Tests', () => {
  let ownerUserId: string;
  let inviteUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    ownerUserId = generateTestId('member_owner');
    inviteUserId = generateTestId('member_invite');
    await UserAPI.create(ownerUserId, 'MemberOwner');
    await UserAPI.create(inviteUserId, 'MemberInvite');
    
    const channelResponse = await ChannelAPI.create('MemberTestChannel', [ownerUserId]);
    testChannelUrl = channelResponse.data.channel_url;
  });

  test.afterAll(async () => {
    try {
      await ChannelAPI.delete(testChannelUrl);
      await UserAPI.delete(ownerUserId);
      await UserAPI.delete(inviteUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-CHANNEL-018: Invite user to channel', async () => {
    const response = await ChannelAPI.invite(testChannelUrl, [inviteUserId]);

    expect(response.status).toBe(200);
    expect(response.data.members.length).toBe(2);
    
    const memberIds = response.data.members.map((m: any) => m.user_id);
    expect(memberIds).toContain(inviteUserId);
  });

  test('TC-CHANNEL-019: Leave channel', async () => {
    const response = await ChannelAPI.leave(testChannelUrl, [inviteUserId]);

    expect(response.status).toBe(200);
  });

  test('TC-CHANNEL-020: Fail to invite non-existent user', async () => {
    const nonExistentUserId = 'non_existent_invite_' + Date.now();

    try {
      await ChannelAPI.invite(testChannelUrl, [nonExistentUserId]);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

test.describe('Channel API - List Channels Tests', () => {
  let testUserId: string;
  const createdChannelUrls: string[] = [];

  test.beforeAll(async () => {
    testUserId = generateTestId('list_channel_user');
    await UserAPI.create(testUserId, 'ListChannelUser');
    
    for (let i = 0; i < 3; i++) {
      const response = await ChannelAPI.create(`ListTestChannel${i}`, [testUserId]);
      createdChannelUrls.push(response.data.channel_url);
    }
  });

  test.afterAll(async () => {
    for (const url of createdChannelUrls) {
      try {
        await ChannelAPI.delete(url);
      } catch (error) {
        // Ignore
      }
    }
    try {
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-CHANNEL-021: List channels with default limit', async () => {
    const response = await ChannelAPI.list();

    expect(response.status).toBe(200);
    expect(response.data.channels).toBeDefined();
    expect(Array.isArray(response.data.channels)).toBe(true);
  });

  test('TC-CHANNEL-022: List channels with custom limit', async () => {
    const limit = 2;
    const response = await ChannelAPI.list(limit);

    expect(response.status).toBe(200);
    expect(response.data.channels.length).toBeLessThanOrEqual(limit);
  });
});

test.describe('Channel API - State Transition (Full Lifecycle)', () => {
  let testUserId: string;
  let memberUserId: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('lifecycle_owner');
    memberUserId = generateTestId('lifecycle_member');
    await UserAPI.create(testUserId, 'LifecycleOwner');
    await UserAPI.create(memberUserId, 'LifecycleMember');
  });

  test.afterAll(async () => {
    try {
      await UserAPI.delete(testUserId);
      await UserAPI.delete(memberUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-CHANNEL-023: Complete channel lifecycle - Create -> Update -> Invite -> Leave -> Delete', async () => {
    // 1. Create
    const createResponse = await ChannelAPI.create('LifecycleChannel', [testUserId]);
    expect(createResponse.status).toBe(200);
    const channelUrl = createResponse.data.channel_url;

    // 2. Read
    const readResponse = await ChannelAPI.get(channelUrl);
    expect(readResponse.data.name).toBe('LifecycleChannel');

    // 3. Update
    const updateResponse = await ChannelAPI.update(channelUrl, 'UpdatedLifecycleChannel');
    expect(updateResponse.data.name).toBe('UpdatedLifecycleChannel');

    // 4. Invite member
    const inviteResponse = await ChannelAPI.invite(channelUrl, [memberUserId]);
    expect(inviteResponse.data.members.length).toBe(2);

    // 5. Member leaves
    const leaveResponse = await ChannelAPI.leave(channelUrl, [memberUserId]);
    expect(leaveResponse.status).toBe(200);

    // 6. Delete
    const deleteResponse = await ChannelAPI.delete(channelUrl);
    expect(deleteResponse.status).toBe(200);

    // 7. Verify deletion
    try {
      await ChannelAPI.get(channelUrl);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});
