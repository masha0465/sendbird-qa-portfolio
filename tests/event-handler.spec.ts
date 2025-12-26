/**
 * Sendbird JavaScript SDK - Event Handler Tests
 */

import SendbirdChat, { ConnectionHandler } from '@sendbird/chat';
import { OpenChannelModule, OpenChannelHandler } from '@sendbird/chat/openChannel';
import { GroupChannelModule, GroupChannelHandler } from '@sendbird/chat/groupChannel';

const APP_ID = process.env.SENDBIRD_APP_ID || '';

describe('SDK Event Handler Tests', () => {
  let sb: any;
  let testUserId: string;

  beforeAll(async () => {
    sb = SendbirdChat.init({
      appId: APP_ID,
      modules: [new OpenChannelModule(), new GroupChannelModule()],
    });
    
    testUserId = `sdk_event_user_${Date.now()}`;
    await sb.connect(testUserId);
  });

  afterAll(async () => {
    await sb.disconnect();
  });

  describe('Connection Event Handler Tests', () => {
    test('TC-SDK-025: Add connection event handler', () => {
      const handlerId = 'test_connection_handler';
      
      const connectionHandler = new ConnectionHandler({
        onReconnectStarted: () => {
          console.log('Reconnect started');
        },
        onReconnectSucceeded: () => {
          console.log('Reconnect succeeded');
        },
        onReconnectFailed: () => {
          console.log('Reconnect failed');
        },
        onDisconnected: (userId: string) => {
          console.log(`Disconnected: ${userId}`);
        },
      });

      sb.addConnectionHandler(handlerId, connectionHandler);
      expect(() => sb.addConnectionHandler(handlerId, connectionHandler)).not.toThrow();
      sb.removeConnectionHandler(handlerId);
    });

    test('TC-SDK-025-2: Remove connection event handler', () => {
      const handlerId = 'test_remove_handler';
      
      const connectionHandler = new ConnectionHandler({
        onDisconnected: () => {},
      });

      sb.addConnectionHandler(handlerId, connectionHandler);
      sb.removeConnectionHandler(handlerId);
      expect(() => sb.removeConnectionHandler(handlerId)).not.toThrow();
    });
  });

  describe('Open Channel Event Handler Tests', () => {
    let testChannel: any;

    beforeAll(async () => {
      testChannel = await sb.openChannel.createChannel({
        name: `Event Handler Test Channel ${Date.now()}`,
      });
      await testChannel.enter();
    });

    afterAll(async () => {
      try {
        await testChannel.exit();
        await testChannel.delete();
      } catch (error) {}
    });

    test('TC-SDK-023: Register message received handler for Open Channel', async () => {
      const handlerId = 'open_channel_message_handler';

      const channelHandler: OpenChannelHandler = {
        onMessageReceived: (channel, message) => {
          console.log(`Message received in ${channel.url}: ${message.message}`);
        },
        onUserEntered: (channel, user) => {
          console.log(`User entered: ${user.userId}`);
        },
        onUserExited: (channel, user) => {
          console.log(`User exited: ${user.userId}`);
        },
      };

      sb.openChannel.addOpenChannelHandler(handlerId, channelHandler);
      expect(() => {
        sb.openChannel.addOpenChannelHandler(handlerId, channelHandler);
      }).not.toThrow();
      sb.openChannel.removeOpenChannelHandler(handlerId);
    });

    test('TC-SDK-024: Register channel changed handler', () => {
      const handlerId = 'open_channel_change_handler';

      const channelHandler: OpenChannelHandler = {
        onChannelChanged: (channel) => {
          console.log(`Channel changed: ${channel.name}`);
        },
        onChannelDeleted: (channelUrl, channelType) => {
          console.log(`Channel deleted: ${channelUrl}`);
        },
      };

      sb.openChannel.addOpenChannelHandler(handlerId, channelHandler);
      expect(() => {
        sb.openChannel.addOpenChannelHandler(handlerId, channelHandler);
      }).not.toThrow();
      sb.openChannel.removeOpenChannelHandler(handlerId);
    });
  });

  describe('Group Channel Event Handler Tests', () => {
    let testChannel: any;

    beforeAll(async () => {
      testChannel = await sb.groupChannel.createChannel({
        invitedUserIds: [testUserId],
        name: `Group Event Test Channel ${Date.now()}`,
        isDistinct: false,
      });
    });

    afterAll(async () => {
      try {
        await testChannel.leave();
      } catch (error) {}
    });

    test('TC-SDK-023-2: Register message received handler for Group Channel', () => {
      const handlerId = 'group_channel_message_handler';

      const channelHandler: GroupChannelHandler = {
        onMessageReceived: (channel, message) => {
          console.log(`Group message received: ${message.message}`);
        },
        onMessageUpdated: (channel, message) => {
          console.log(`Message updated: ${message.messageId}`);
        },
        onMessageDeleted: (channel, messageId) => {
          console.log(`Message deleted: ${messageId}`);
        },
      };

      sb.groupChannel.addGroupChannelHandler(handlerId, channelHandler);
      expect(() => {
        sb.groupChannel.addGroupChannelHandler(handlerId, channelHandler);
      }).not.toThrow();
      sb.groupChannel.removeGroupChannelHandler(handlerId);
    });

    test('TC-SDK-024-2: Register typing indicator handler', () => {
      const handlerId = 'typing_indicator_handler';

      const channelHandler: GroupChannelHandler = {
        onTypingStatusUpdated: (channel) => {
          const typingUsers = channel.getTypingUsers();
          console.log(`Typing users: ${typingUsers.map((u: any) => u.userId).join(', ')}`);
        },
      };

      sb.groupChannel.addGroupChannelHandler(handlerId, channelHandler);
      expect(() => {
        sb.groupChannel.addGroupChannelHandler(handlerId, channelHandler);
      }).not.toThrow();
      sb.groupChannel.removeGroupChannelHandler(handlerId);
    });

    test('TC-SDK-024-3: Register read receipt handler', () => {
      const handlerId = 'read_receipt_handler';

      const channelHandler: GroupChannelHandler = {
        onUnreadMemberStatusUpdated: (channel) => {
          console.log(`Unread member status updated in ${channel.url}`);
        },
        onUndeliveredMemberStatusUpdated: (channel) => {
          console.log(`Undelivered member status updated in ${channel.url}`);
        },
      };

      sb.groupChannel.addGroupChannelHandler(handlerId, channelHandler);
      expect(() => {
        sb.groupChannel.addGroupChannelHandler(handlerId, channelHandler);
      }).not.toThrow();
      sb.groupChannel.removeGroupChannelHandler(handlerId);
    });
  });

  describe('State Transition Test', () => {
    test('TC-SDK-028: Complete flow - Connect -> Create -> Enter -> Send -> Exit -> Disconnect', async () => {
      // 1. 이미 연결됨
      expect(sb.connectionState).toBe('OPEN');
      expect(sb.currentUser?.userId).toBe(testUserId);

      // 2. 채널 생성
      const channel = await sb.openChannel.createChannel({
        name: `State Transition Test ${Date.now()}`,
      });
      expect(channel.url).toBeTruthy();

      // 3. 채널 입장
      await channel.enter();

      // 4. 메시지 전송
      const message = await new Promise<any>((resolve, reject) => {
        channel.sendUserMessage({ message: 'State transition test message' })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });
      expect(message.messageId).toBeTruthy();

      // 5. 메시지 조회
      const messages = await channel.getMessagesByTimestamp(Date.now(), {
        prevResultSize: 5,
        nextResultSize: 0,
        isInclusive: true,
      });
      expect(messages.length).toBeGreaterThan(0);

      // 6. 메시지 수정
      const updatedMessage = await channel.updateUserMessage(message.messageId, {
        message: 'Updated state transition message',
      });
      expect(updatedMessage.message).toBe('Updated state transition message');

      // 7. 채널 퇴장
      await channel.exit();

      // 8. 채널 삭제
      await channel.delete();

      // 연결은 유지
      expect(sb.connectionState).toBe('OPEN');
    });
  });
});
