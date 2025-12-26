/**
 * Sendbird JavaScript SDK - Message Tests
 */

import SendbirdChat from '@sendbird/chat';
import { OpenChannelModule } from '@sendbird/chat/openChannel';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

const APP_ID = process.env.SENDBIRD_APP_ID || '';

describe('SDK Message Tests', () => {
  let sb: any;
  let testUserId: string;
  let testOpenChannel: any;
  let testGroupChannel: any;

  beforeAll(async () => {
    sb = SendbirdChat.init({
      appId: APP_ID,
      modules: [new OpenChannelModule(), new GroupChannelModule()],
    });
    
    testUserId = `sdk_msg_user_${Date.now()}`;
    await sb.connect(testUserId);

    testOpenChannel = await sb.openChannel.createChannel({
      name: `Message Test Open Channel ${Date.now()}`,
    });
    await testOpenChannel.enter();

    testGroupChannel = await sb.groupChannel.createChannel({
      invitedUserIds: [testUserId],
      name: `Message Test Group Channel ${Date.now()}`,
      isDistinct: false,
    });
  });

  afterAll(async () => {
    try {
      await testOpenChannel.exit();
      await testOpenChannel.delete();
    } catch (error) {}

    try {
      await testGroupChannel.leave();
    } catch (error) {}

    await sb.disconnect();
  });

  describe('Send Message Tests - Open Channel', () => {
    test('TC-SDK-017: Send simple text message', async () => {
      const messageText = 'Hello, Sendbird!';

      const message = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({ message: messageText })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      expect(message).toBeDefined();
      expect(message.message).toBe(messageText);
      expect(message.messageId).toBeTruthy();
      expect(message.sender?.userId).toBe(testUserId);
    });

    test('TC-SDK-018: Send Korean text message', async () => {
      const messageText = '안녕하세요, 센드버드입니다!';

      const message = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({ message: messageText })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      expect(message.message).toBe(messageText);
    });

    test('TC-SDK-019: Send emoji message', async () => {
      const messageText = '🎉🚀💬👋';

      const message = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({ message: messageText })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      expect(message.message).toBe(messageText);
    });

    test('TC-SDK-017-2: Send message with custom type', async () => {
      const messageText = 'Message with custom type';
      const customType = 'notification';

      const message = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({
          message: messageText,
          customType: customType,
        })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      expect(message.customType).toBe(customType);
    });

    test('TC-SDK-017-3: Send message with data payload', async () => {
      const messageText = 'Message with data';
      const data = JSON.stringify({ key: 'value', count: 123 });

      const message = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({
          message: messageText,
          data: data,
        })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      expect(message.data).toBe(data);
    });

    test('TC-SDK-017-4: Send multiline message', async () => {
      const messageText = 'Line 1\nLine 2\nLine 3';

      const message = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({ message: messageText })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      expect(message.message).toBe(messageText);
      expect(message.message.split('\n').length).toBe(3);
    });
  });

  describe('Send Message Tests - Group Channel', () => {
    test('TC-SDK-017-5: Send message to Group Channel', async () => {
      const messageText = 'Hello Group Channel!';

      const message = await new Promise<any>((resolve, reject) => {
        testGroupChannel.sendUserMessage({ message: messageText })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      expect(message).toBeDefined();
      expect(message.message).toBe(messageText);
      expect(message.channelUrl).toBe(testGroupChannel.url);
    });
  });

  describe('Retrieve Messages Tests', () => {
    test('TC-SDK-020: List messages from Open Channel', async () => {
      const params = {
        prevResultSize: 10,
        nextResultSize: 0,
        isInclusive: true,
      };

      const messages = await testOpenChannel.getMessagesByTimestamp(Date.now(), params);
      expect(Array.isArray(messages)).toBe(true);
    });

    test('TC-SDK-020-2: List messages from Group Channel', async () => {
      const params = {
        prevResultSize: 10,
        nextResultSize: 0,
        isInclusive: true,
      };

      const messages = await testGroupChannel.getMessagesByTimestamp(Date.now(), params);
      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe('Update/Delete Message Tests', () => {
    let testMessage: any;

    beforeAll(async () => {
      testMessage = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({ message: 'Original message' })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });
    });

    test('TC-SDK-021: Update message text', async () => {
      const newText = 'Updated message text';
      const params = { message: newText };

      const updatedMessage = await testOpenChannel.updateUserMessage(
        testMessage.messageId,
        params
      );

      expect(updatedMessage.message).toBe(newText);
      expect(updatedMessage.messageId).toBe(testMessage.messageId);
    });

    test('TC-SDK-022: Delete message', async () => {
      const messageToDelete = await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({ message: 'Message to delete' })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      await testOpenChannel.deleteMessage(messageToDelete);
    });
  });

  describe('Performance Tests', () => {
    test('TC-SDK-030: Message send response time under 2 seconds', async () => {
      const messageText = 'Performance test message';

      const startTime = Date.now();
      
      await new Promise<any>((resolve, reject) => {
        testOpenChannel.sendUserMessage({ message: messageText })
          .onSucceeded((msg: any) => resolve(msg))
          .onFailed((err: any) => reject(err));
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`Message send response time: ${responseTime}ms`);
      expect(responseTime).toBeLessThan(2000);
    });

    test('TC-SDK-030-2: Send multiple messages sequentially', async () => {
      const messageCount = 5;
      const times: number[] = [];

      for (let i = 0; i < messageCount; i++) {
        const startTime = Date.now();
        
        await new Promise<any>((resolve, reject) => {
          testOpenChannel.sendUserMessage({ message: `Sequential message ${i + 1}` })
            .onSucceeded((msg: any) => resolve(msg))
            .onFailed((err: any) => reject(err));
        });

        times.push(Date.now() - startTime);
      }

      const totalTime = times.reduce((a, b) => a + b, 0);
      const avgTime = totalTime / messageCount;

      console.log(`Total time for ${messageCount} messages: ${totalTime}ms`);
      console.log(`Average time per message: ${avgTime}ms`);

      expect(avgTime).toBeLessThan(1000);
    });
  });
});
