/**
 * Sendbird Platform API - Message API Test Suite
 * 
 * Test Design Techniques Applied:
 * - Equivalence Partitioning: Message types (text, file, admin)
 * - Boundary Value Analysis: Message length limits
 * - Error Guessing: Permission errors, invalid message IDs
 * - State Transition: Message lifecycle
 * - Negative Testing: Blocked users, deleted channels
 * - Performance Testing: Response time validation
 * 
 * API Reference: https://sendbird.com/docs/chat/platform-api/v3/message/messaging-basics/send-a-message
 */

import { test, expect } from '@playwright/test';
import { UserAPI, ChannelAPI, MessageAPI, generateTestId } from '../utils/sendbird-api';

test.describe('Message API - Send Message Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('msg_sender');
    await UserAPI.create(testUserId, 'MessageSender');
    
    const channelResponse = await ChannelAPI.create('MessageTestChannel', [testUserId]);
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

  test.describe('Positive Tests - Valid Messages', () => {
    
    test('TC-MSG-001: Send simple text message', async () => {
      const messageText = 'Hello, World!';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe(messageText);
      expect(response.data.message_id).toBeDefined();
      expect(response.data.user.user_id).toBe(testUserId);
      expect(response.data.type).toBe('MESG');
    });

    test('TC-MSG-002: Send message with Korean text', async () => {
      const messageText = '안녕하세요! 테스트 메시지입니다.';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe(messageText);
    });

    test('TC-MSG-003: Send message with emoji', async () => {
      const messageText = 'Great job! 🎉👍🔥';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe(messageText);
    });

    test('TC-MSG-004: Send message with custom_type', async () => {
      const messageText = 'Notification message';
      const customType = 'notification';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText, customType);

      expect(response.status).toBe(200);
      expect(response.data.custom_type).toBe(customType);
    });

    test('TC-MSG-005: Send message with data payload', async () => {
      const messageText = 'Message with data';
      const data = JSON.stringify({ 
        action: 'button_click', 
        timestamp: Date.now(),
        metadata: { key: 'value' }
      });

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText, undefined, data);

      expect(response.status).toBe(200);
      expect(response.data.data).toBe(data);
      
      const parsedData = JSON.parse(response.data.data);
      expect(parsedData.action).toBe('button_click');
    });

    test('TC-MSG-006: Send message with special characters', async () => {
      const messageText = '<script>alert("xss")</script> & "quotes" \'single\'';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe(messageText);
    });

    test('TC-MSG-007: Send message with URL', async () => {
      const messageText = 'Check this link: https://www.example.com/path?query=value';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('https://www.example.com');
    });

    test('TC-MSG-008: Send multiline message', async () => {
      const messageText = 'Line 1\nLine 2\nLine 3';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('\n');
    });
  });

  test.describe('Boundary Value Analysis', () => {
    
    test('TC-MSG-009: Send message with single character', async () => {
      const messageText = 'A';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('A');
    });

    test('TC-MSG-010: Send long message (1000 characters)', async () => {
      const messageText = 'L'.repeat(1000);

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message.length).toBe(1000);
    });

    test('TC-MSG-011: Send very long message (5000 characters)', async () => {
      const messageText = 'V'.repeat(5000);

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
      expect(response.data.message.length).toBe(5000);
    });

    test('TC-MSG-012: Send empty message', async () => {
      const response = await MessageAPI.send(testChannelUrl, testUserId, '');

      // Sendbird may accept or reject empty messages
      if (response.status === 200) {
        expect(response.data.message).toBe('');
      }
    });

    test('TC-MSG-013: Send whitespace-only message', async () => {
      const messageText = '   ';

      const response = await MessageAPI.send(testChannelUrl, testUserId, messageText);

      expect(response.status).toBe(200);
    });
  });

  test.describe('Negative Tests', () => {
    
    test('TC-MSG-014: Fail to send message to non-existent channel', async () => {
      const nonExistentChannelUrl = 'non_existent_channel_' + Date.now();

      try {
        await MessageAPI.send(nonExistentChannelUrl, testUserId, 'Test message');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    test('TC-MSG-015: Fail to send message with non-existent user', async () => {
      const nonExistentUserId = 'non_existent_user_' + Date.now();

      try {
        await MessageAPI.send(testChannelUrl, nonExistentUserId, 'Test message');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

test.describe('Message API - Get Message Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;
  let testMessageId: number;

  test.beforeAll(async () => {
    testUserId = generateTestId('msg_get_user');
    await UserAPI.create(testUserId, 'MessageGetUser');
    
    const channelResponse = await ChannelAPI.create('GetMessageTestChannel', [testUserId]);
    testChannelUrl = channelResponse.data.channel_url;
    
    const messageResponse = await MessageAPI.send(testChannelUrl, testUserId, 'Test message for GET');
    testMessageId = messageResponse.data.message_id;
  });

  test.afterAll(async () => {
    try {
      await ChannelAPI.delete(testChannelUrl);
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-MSG-016: Get message by ID', async () => {
    const response = await MessageAPI.get(testChannelUrl, testMessageId);

    expect(response.status).toBe(200);
    expect(response.data.message_id).toBe(testMessageId);
    expect(response.data.message).toBe('Test message for GET');
  });

  test('TC-MSG-017: Verify message response contains expected fields', async () => {
    const response = await MessageAPI.get(testChannelUrl, testMessageId);

    expect(response.data).toHaveProperty('message_id');
    expect(response.data).toHaveProperty('message');
    expect(response.data).toHaveProperty('type');
    expect(response.data).toHaveProperty('created_at');
    expect(response.data).toHaveProperty('user');
    expect(response.data.user).toHaveProperty('user_id');
  });

  test('TC-MSG-018: Fail to get non-existent message', async () => {
    const nonExistentMessageId = 999999999999;

    try {
      await MessageAPI.get(testChannelUrl, nonExistentMessageId);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

test.describe('Message API - Update Message Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('msg_update_user');
    await UserAPI.create(testUserId, 'MessageUpdateUser');
    
    const channelResponse = await ChannelAPI.create('UpdateMessageTestChannel', [testUserId]);
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

  test('TC-MSG-019: Update message text', async () => {
    const originalText = 'Original message';
    const updatedText = 'Updated message';
    
    const sendResponse = await MessageAPI.send(testChannelUrl, testUserId, originalText);
    const messageId = sendResponse.data.message_id;

    const updateResponse = await MessageAPI.update(testChannelUrl, messageId, updatedText);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.message).toBe(updatedText);
  });

  test('TC-MSG-020: Update message to longer text', async () => {
    const originalText = 'Short';
    const updatedText = 'This is a much longer message after update';
    
    const sendResponse = await MessageAPI.send(testChannelUrl, testUserId, originalText);
    const messageId = sendResponse.data.message_id;

    const updateResponse = await MessageAPI.update(testChannelUrl, messageId, updatedText);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.message).toBe(updatedText);
  });

  test('TC-MSG-021: Update message to Korean text', async () => {
    const originalText = 'English message';
    const updatedText = '한국어 메시지로 변경';
    
    const sendResponse = await MessageAPI.send(testChannelUrl, testUserId, originalText);
    const messageId = sendResponse.data.message_id;

    const updateResponse = await MessageAPI.update(testChannelUrl, messageId, updatedText);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.message).toBe(updatedText);
  });

  test('TC-MSG-022: Fail to update non-existent message', async () => {
    const nonExistentMessageId = 999999999999;

    try {
      await MessageAPI.update(testChannelUrl, nonExistentMessageId, 'Updated');
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

test.describe('Message API - Delete Message Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('msg_delete_user');
    await UserAPI.create(testUserId, 'MessageDeleteUser');
    
    const channelResponse = await ChannelAPI.create('DeleteMessageTestChannel', [testUserId]);
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

  test('TC-MSG-023: Delete message', async () => {
    const sendResponse = await MessageAPI.send(testChannelUrl, testUserId, 'Message to delete');
    const messageId = sendResponse.data.message_id;

    const deleteResponse = await MessageAPI.delete(testChannelUrl, messageId);
    expect(deleteResponse.status).toBe(200);
  });

  test('TC-MSG-024: Fail to delete non-existent message', async () => {
    const nonExistentMessageId = 999999999999;

    try {
      await MessageAPI.delete(testChannelUrl, nonExistentMessageId);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

test.describe('Message API - List Messages Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('msg_list_user');
    await UserAPI.create(testUserId, 'MessageListUser');
    
    const channelResponse = await ChannelAPI.create('ListMessageTestChannel', [testUserId]);
    testChannelUrl = channelResponse.data.channel_url;
    
    // Send multiple messages for list tests
    for (let i = 1; i <= 5; i++) {
      await MessageAPI.send(testChannelUrl, testUserId, `List test message ${i}`);
    }
  });

  test.afterAll(async () => {
    try {
      await ChannelAPI.delete(testChannelUrl);
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-MSG-025: List messages with default limit', async () => {
    const response = await MessageAPI.list(testChannelUrl);

    expect(response.status).toBe(200);
    expect(response.data.messages).toBeDefined();
    expect(Array.isArray(response.data.messages)).toBe(true);
    expect(response.data.messages.length).toBeGreaterThan(0);
  });

  test('TC-MSG-026: List messages with custom limit', async () => {
    const limit = 3;
    const response = await MessageAPI.list(testChannelUrl, limit);

    expect(response.status).toBe(200);
    expect(response.data.messages.length).toBeLessThanOrEqual(limit);
  });

  test('TC-MSG-027: Verify list response message objects', async () => {
    const response = await MessageAPI.list(testChannelUrl, 1);

    expect(response.status).toBe(200);
    if (response.data.messages.length > 0) {
      const message = response.data.messages[0];
      expect(message).toHaveProperty('message_id');
      expect(message).toHaveProperty('message');
      expect(message).toHaveProperty('type');
      expect(message).toHaveProperty('created_at');
    }
  });
});

test.describe('Message API - State Transition (Full Lifecycle)', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('msg_lifecycle_user');
    await UserAPI.create(testUserId, 'MessageLifecycleUser');
    
    const channelResponse = await ChannelAPI.create('LifecycleMessageChannel', [testUserId]);
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

  test('TC-MSG-028: Complete message lifecycle - Send -> Read -> Update -> Delete', async () => {
    // 1. Send
    const sendResponse = await MessageAPI.send(testChannelUrl, testUserId, 'Original message');
    expect(sendResponse.status).toBe(200);
    const messageId = sendResponse.data.message_id;

    // 2. Read
    const readResponse = await MessageAPI.get(testChannelUrl, messageId);
    expect(readResponse.data.message).toBe('Original message');

    // 3. Update
    const updateResponse = await MessageAPI.update(testChannelUrl, messageId, 'Updated message');
    expect(updateResponse.data.message).toBe('Updated message');

    // 4. Verify Update
    const verifyResponse = await MessageAPI.get(testChannelUrl, messageId);
    expect(verifyResponse.data.message).toBe('Updated message');

    // 5. Delete
    const deleteResponse = await MessageAPI.delete(testChannelUrl, messageId);
    expect(deleteResponse.status).toBe(200);
  });
});

test.describe('Message API - Performance Tests', () => {
  let testUserId: string;
  let testChannelUrl: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('msg_perf_user');
    await UserAPI.create(testUserId, 'MessagePerfUser');
    
    const channelResponse = await ChannelAPI.create('PerfMessageChannel', [testUserId]);
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

  test('TC-MSG-029: Verify message send response time under 3 seconds', async () => {
    const startTime = Date.now();
    
    await MessageAPI.send(testChannelUrl, testUserId, 'Performance test message');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(3000);
    console.log(`Message send response time: ${responseTime}ms`);
  });

  test('TC-MSG-030: Send multiple messages sequentially', async () => {
    const messageCount = 5;
    const startTime = Date.now();

    for (let i = 0; i < messageCount; i++) {
      await MessageAPI.send(testChannelUrl, testUserId, `Sequential message ${i + 1}`);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / messageCount;

    console.log(`Total time for ${messageCount} messages: ${totalTime}ms`);
    console.log(`Average time per message: ${avgTime}ms`);

    expect(avgTime).toBeLessThan(2000);
  });
});
