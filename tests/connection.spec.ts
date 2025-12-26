/**
 * Sendbird JavaScript SDK - Connection Tests
 */

import SendbirdChat from '@sendbird/chat';
import { OpenChannelModule } from '@sendbird/chat/openChannel';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

const APP_ID = process.env.SENDBIRD_APP_ID || '';

describe('SDK Connection Tests', () => {
  let sb: any;

  afterEach(async () => {
    try {
      if (sb && sb.connectionState === 'OPEN') {
        await sb.disconnect();
      }
    } catch (error) {}
  });

  describe('Initialization Tests', () => {
    test('TC-SDK-001: Initialize SDK with valid App ID', () => {
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      
      expect(sb).toBeDefined();
      expect(sb.appId).toBe(APP_ID);
    });

    test('TC-SDK-005: Initialize SDK with invalid App ID should not throw immediately', () => {
      const invalidAppId = 'INVALID_APP_ID_12345';
      
      expect(() => {
        SendbirdChat.init({
          appId: invalidAppId,
          modules: [new OpenChannelModule()],
        });
      }).not.toThrow();
    });
  });

  describe('Connection Tests', () => {
    test('TC-SDK-002: Connect user with valid User ID', async () => {
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      const userId = `test_user_${Date.now()}`;
      
      const user = await sb.connect(userId);
      
      expect(user).toBeDefined();
      expect(user.userId).toBe(userId);
      expect(sb.connectionState).toBe('OPEN');
    });

    test('TC-SDK-003: Disconnect user', async () => {
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      const userId = `test_user_${Date.now()}`;
      
      await sb.connect(userId);
      expect(sb.connectionState).toBe('OPEN');
      
      await sb.disconnect();
      expect(sb.connectionState).toBe('CLOSED');
    });

    test('TC-SDK-006: Connect with new User ID auto-creates user', async () => {
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      const newUserId = `new_auto_user_${Date.now()}`;
      
      const user = await sb.connect(newUserId);
      
      expect(user).toBeDefined();
      expect(user.userId).toBe(newUserId);
    });
  });

  describe('Performance Tests', () => {
    test('TC-SDK-029: Connection time should be under 3 seconds', async () => {
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      const userId = `perf_user_${Date.now()}`;
      
      const startTime = Date.now();
      await sb.connect(userId);
      const endTime = Date.now();
      
      const connectionTime = endTime - startTime;
      console.log(`Connection time: ${connectionTime}ms`);
      
      expect(connectionTime).toBeLessThan(3000);
    });
  });
});
