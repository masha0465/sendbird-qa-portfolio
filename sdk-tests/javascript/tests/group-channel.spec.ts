/**
 * Sendbird JavaScript SDK - Group Channel Tests
 */

import SendbirdChat from '@sendbird/chat';
import { OpenChannelModule } from '@sendbird/chat/openChannel';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

const APP_ID = process.env.SENDBIRD_APP_ID || '';

describe('SDK Group Channel Tests', () => {
  let sb: any;
  let testUserId: string;
  let testUserId2: string;
  let createdChannelUrls: string[] = [];

  beforeAll(async () => {
    sb = SendbirdChat.init({
      appId: APP_ID,
      modules: [new OpenChannelModule(), new GroupChannelModule()],
    });
    
    testUserId = `sdk_group_user1_${Date.now()}`;
    testUserId2 = `sdk_group_user2_${Date.now()}`;
    
    await sb.connect(testUserId);
  });

  afterAll(async () => {
    for (const channelUrl of createdChannelUrls) {
      try {
        const channel = await sb.groupChannel.getChannel(channelUrl);
        await channel.leave();
      } catch (error) {}
    }
    await sb.disconnect();
  });

  describe('Create Group Channel Tests', () => {
    test('TC-SDK-012: Create Group Channel with single user', async () => {
      const params = {
        invitedUserIds: [testUserId],
        name: `Test Group Channel ${Date.now()}`,
        isDistinct: false,
      };

      const channel = await sb.groupChannel.createChannel(params);
      createdChannelUrls.push(channel.url);

      expect(channel).toBeDefined();
      expect(channel.name).toBe(params.name);
      expect(channel.url).toBeTruthy();
      expect(channel.memberCount).toBeGreaterThanOrEqual(1);
    });

    test('TC-SDK-012-2: Create Group Channel with multiple users', async () => {
      const params = {
        invitedUserIds: [testUserId, testUserId2],
        name: `Multi User Channel ${Date.now()}`,
        isDistinct: false,
      };

      const channel = await sb.groupChannel.createChannel(params);
      createdChannelUrls.push(channel.url);

      expect(channel).toBeDefined();
      expect(channel.memberCount).toBeGreaterThanOrEqual(1);
    });

    test('TC-SDK-012-3: Create Distinct Group Channel', async () => {
      const params = {
        invitedUserIds: [testUserId],
        name: `Distinct Channel ${Date.now()}`,
        isDistinct: true,
      };

      const channel1 = await sb.groupChannel.createChannel(params);
      createdChannelUrls.push(channel1.url);

      const channel2 = await sb.groupChannel.createChannel({
        invitedUserIds: [testUserId],
        isDistinct: true,
      });

      expect(channel2.url).toBe(channel1.url);
    });

    test('TC-SDK-012-4: Create Group Channel with Korean name', async () => {
      const params = {
        invitedUserIds: [testUserId],
        name: '테스트 그룹 채널',
        isDistinct: false,
      };

      const channel = await sb.groupChannel.createChannel(params);
      createdChannelUrls.push(channel.url);

      expect(channel.name).toBe('테스트 그룹 채널');
    });

    test('TC-SDK-012-5: Create Group Channel with custom type', async () => {
      const params = {
        invitedUserIds: [testUserId],
        name: `Custom Type Channel ${Date.now()}`,
        customType: 'support_chat',
        isDistinct: false,
      };

      const channel = await sb.groupChannel.createChannel(params);
      createdChannelUrls.push(channel.url);

      expect(channel.customType).toBe('support_chat');
    });
  });

  describe('Invite/Leave Group Channel Tests', () => {
    let testChannel: any;

    beforeAll(async () => {
      const params = {
        invitedUserIds: [testUserId],
        name: `Invite Leave Test Channel ${Date.now()}`,
        isDistinct: false,
      };
      testChannel = await sb.groupChannel.createChannel(params);
      createdChannelUrls.push(testChannel.url);
    });

    test('TC-SDK-013: Invite user to Group Channel', async () => {
      const newUserId = `invite_test_user_${Date.now()}`;
      
      await testChannel.inviteWithUserIds([newUserId]);
      
      const refreshedChannel = await sb.groupChannel.getChannel(testChannel.url);
      
      expect(refreshedChannel.memberCount).toBeGreaterThanOrEqual(1);
    });

    test('TC-SDK-014: Leave Group Channel', async () => {
      const params = {
        invitedUserIds: [testUserId],
        name: `Leave Test Channel ${Date.now()}`,
        isDistinct: false,
      };
      const leaveTestChannel = await sb.groupChannel.createChannel(params);

      await leaveTestChannel.leave();
    });
  });

  describe('Query Group Channel Tests', () => {
    test('TC-SDK-015: List Group Channels', async () => {
      const query = sb.groupChannel.createMyGroupChannelListQuery({
        limit: 10,
        includeEmpty: true,
      });

      const channels = await query.next();
      expect(Array.isArray(channels)).toBe(true);
    });

    test('TC-SDK-015-2: List Group Channels with custom type filter', async () => {
      const query = sb.groupChannel.createMyGroupChannelListQuery({
        limit: 10,
        customTypesFilter: ['support_chat'],
        includeEmpty: true,
      });

      const channels = await query.next();
      expect(Array.isArray(channels)).toBe(true);
      channels.forEach((channel: any) => {
        expect(channel.customType).toBe('support_chat');
      });
    });

    test('TC-SDK-016: Get Group Channel by URL', async () => {
      const params = {
        invitedUserIds: [testUserId],
        name: `URL Query Test ${Date.now()}`,
        isDistinct: false,
      };
      const createdChannel = await sb.groupChannel.createChannel(params);
      createdChannelUrls.push(createdChannel.url);

      const fetchedChannel = await sb.groupChannel.getChannel(createdChannel.url);

      expect(fetchedChannel).toBeDefined();
      expect(fetchedChannel.url).toBe(createdChannel.url);
      expect(fetchedChannel.name).toBe(createdChannel.name);
    });

    test('TC-SDK-027-2: Get non-existent Group Channel should fail', async () => {
      const nonExistentUrl = `non_existent_group_${Date.now()}`;
      await expect(sb.groupChannel.getChannel(nonExistentUrl)).rejects.toThrow();
    });
  });
});
