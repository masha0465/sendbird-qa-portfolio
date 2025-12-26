/**
 * Sendbird JavaScript SDK - Open Channel Tests
 */

import SendbirdChat from '@sendbird/chat';
import { OpenChannelModule } from '@sendbird/chat/openChannel';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

const APP_ID = process.env.SENDBIRD_APP_ID || '';

describe('SDK Open Channel Tests', () => {
  let sb: any;
  let testUserId: string;
  let createdChannelUrls: string[] = [];

  beforeAll(async () => {
    sb = SendbirdChat.init({
      appId: APP_ID,
      modules: [new OpenChannelModule(), new GroupChannelModule()],
    });
    
    testUserId = `sdk_test_user_${Date.now()}`;
    await sb.connect(testUserId);
  });

  afterAll(async () => {
    for (const channelUrl of createdChannelUrls) {
      try {
        const channel = await sb.openChannel.getChannel(channelUrl);
        await channel.delete();
      } catch (error) {}
    }
    await sb.disconnect();
  });

  describe('Create Open Channel Tests', () => {
    test('TC-SDK-007: Create Open Channel with default params', async () => {
      const params = {
        name: `Test Open Channel ${Date.now()}`,
        customType: 'test_channel',
      };

      const channel = await sb.openChannel.createChannel(params);
      createdChannelUrls.push(channel.url);

      expect(channel).toBeDefined();
      expect(channel.name).toBe(params.name);
      expect(channel.customType).toBe(params.customType);
      expect(channel.url).toBeTruthy();
    });

    test('TC-SDK-007-2: Create Open Channel with Korean name', async () => {
      const params = { name: '테스트 오픈 채널' };

      const channel = await sb.openChannel.createChannel(params);
      createdChannelUrls.push(channel.url);

      expect(channel.name).toBe('테스트 오픈 채널');
    });

    test('TC-SDK-007-3: Create Open Channel with emoji in name', async () => {
      const params = { name: 'Test Channel 🚀💬' };

      const channel = await sb.openChannel.createChannel(params);
      createdChannelUrls.push(channel.url);

      expect(channel.name).toBe('Test Channel 🚀💬');
    });
  });

  describe('Enter/Exit Open Channel Tests', () => {
    let testChannel: any;

    beforeAll(async () => {
      const params = { name: `Enter Exit Test Channel ${Date.now()}` };
      testChannel = await sb.openChannel.createChannel(params);
      createdChannelUrls.push(testChannel.url);
    });

    test('TC-SDK-008: Enter Open Channel', async () => {
      await testChannel.enter();
      expect(testChannel.isOperator(sb.currentUser)).toBe(true);
    });

    test('TC-SDK-009: Exit Open Channel', async () => {
      await testChannel.enter();
      await testChannel.exit();
      expect(testChannel.url).toBeTruthy();
    });
  });

  describe('Query Open Channel Tests', () => {
    test('TC-SDK-010: List Open Channels', async () => {
      const query = sb.openChannel.createOpenChannelListQuery({ limit: 10 });
      const channels = await query.next();
      expect(Array.isArray(channels)).toBe(true);
    });

    test('TC-SDK-010-2: List Open Channels with custom type filter', async () => {
      const query = sb.openChannel.createOpenChannelListQuery({
        limit: 10,
        customTypes: ['test_channel'],
      });

      const channels = await query.next();
      expect(Array.isArray(channels)).toBe(true);
      channels.forEach((channel: any) => {
        expect(channel.customType).toBe('test_channel');
      });
    });

    test('TC-SDK-011: Get Open Channel by URL', async () => {
      const params = { name: `URL Test Channel ${Date.now()}` };
      const createdChannel = await sb.openChannel.createChannel(params);
      createdChannelUrls.push(createdChannel.url);

      const fetchedChannel = await sb.openChannel.getChannel(createdChannel.url);

      expect(fetchedChannel).toBeDefined();
      expect(fetchedChannel.url).toBe(createdChannel.url);
      expect(fetchedChannel.name).toBe(createdChannel.name);
    });

    test('TC-SDK-027: Get non-existent Open Channel should fail', async () => {
      const nonExistentUrl = `non_existent_channel_${Date.now()}`;
      await expect(sb.openChannel.getChannel(nonExistentUrl)).rejects.toThrow();
    });
  });
});
