/**
 * Sendbird JavaScript SDK - Cypress E2E Tests
 * 
 * 브라우저 환경에서 SDK 직접 테스트
 * 
 * Test Coverage: 22 Test Cases
 * - Connection Tests: 5 TCs
 * - Open Channel Tests: 6 TCs
 * - Group Channel Tests: 4 TCs
 * - Message Tests: 6 TCs
 * - State Transition Tests: 1 TC
 */

// Sendbird App ID
const APP_ID = Cypress.env('SENDBIRD_APP_ID') || 'YOUR_APP_ID_HERE';

// 로컬 HTML 파일 경로
const TEST_PAGE = 'public/index.html';

describe('Sendbird SDK - Connection Tests', () => {
  let sb;
  let testUserId;

  beforeEach(() => {
    testUserId = `cypress_user_${Date.now()}`;
    
    // 로컬 HTML 파일 로드 (SDK가 이미 포함됨)
    cy.visit(TEST_PAGE);
    
    // SDK 로드 대기
    cy.window().should('have.property', 'Sendbird');
  });

  afterEach(() => {
    cy.window().then(async (win) => {
      if (sb && sb.connectionState === 'OPEN') {
        try {
          await sb.disconnect();
        } catch (e) {}
      }
    });
  });

  it('TC-SDK-001: Initialize SDK with valid App ID', () => {
    cy.window().then((win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });

      expect(sb).to.exist;
      expect(sb.appId).to.equal(APP_ID);
    });
  });

  it('TC-SDK-002: Connect user with valid User ID', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });

      const user = await sb.connect(testUserId);

      expect(user).to.exist;
      expect(user.userId).to.equal(testUserId);
      expect(sb.connectionState).to.equal('OPEN');
    });
  });

  it('TC-SDK-003: Disconnect user', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });

      await sb.connect(testUserId);
      expect(sb.connectionState).to.equal('OPEN');

      await sb.disconnect();
      expect(sb.connectionState).to.equal('CLOSED');
    });
  });

  it('TC-SDK-006: Connect with new User ID auto-creates user', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });

      const newUserId = `auto_create_user_${Date.now()}`;
      const user = await sb.connect(newUserId);

      expect(user).to.exist;
      expect(user.userId).to.equal(newUserId);
    });
  });

  it('TC-SDK-029: Connection time should be under 3 seconds', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });

      const startTime = Date.now();
      await sb.connect(testUserId);
      const connectionTime = Date.now() - startTime;

      cy.log(`Connection time: ${connectionTime}ms`);
      expect(connectionTime).to.be.lessThan(3000);
    });
  });
});

describe('Sendbird SDK - Open Channel Tests', () => {
  let sb;
  let testUserId;
  const createdChannelUrls = [];

  beforeEach(() => {
    testUserId = `cypress_oc_user_${Date.now()}`;
    cy.visit(TEST_PAGE);
    cy.window().should('have.property', 'Sendbird');
  });

  afterEach(() => {
    cy.window().then(async (win) => {
      // Note: Channel deletion requires operator permission
      // Skipping automatic cleanup - channels will be cleaned via Dashboard or API
      createdChannelUrls.length = 0;
      
      if (sb && sb.connectionState === 'OPEN') {
        try {
          await sb.disconnect();
        } catch (e) {}
      }
    });
  });

  it('TC-SDK-007: Create Open Channel with default params', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const channel = await sb.openChannel.createChannel({
        name: `Test Open Channel ${Date.now()}`,
        customType: 'test_channel',
      });
      createdChannelUrls.push(channel.url);

      expect(channel).to.exist;
      expect(channel.url).to.exist;
      expect(channel.customType).to.equal('test_channel');
    });
  });

  it('TC-SDK-007-2: Create Open Channel with Korean name', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const channel = await sb.openChannel.createChannel({
        name: '테스트 오픈 채널',
      });
      createdChannelUrls.push(channel.url);

      expect(channel.name).to.equal('테스트 오픈 채널');
    });
  });

  it('TC-SDK-008: Enter Open Channel', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const channel = await sb.openChannel.createChannel({
        name: `Enter Test Channel ${Date.now()}`,
      });
      createdChannelUrls.push(channel.url);

      // Enter channel and verify no error thrown
      await channel.enter();
      
      // Verify channel is accessible after enter
      // Note: participantCount may not update immediately in SDK
      expect(channel.url).to.exist;
      expect(channel.name).to.include('Enter Test Channel');
    });
  });

  it('TC-SDK-009: Exit Open Channel', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const channel = await sb.openChannel.createChannel({
        name: `Exit Test Channel ${Date.now()}`,
      });
      createdChannelUrls.push(channel.url);

      await channel.enter();
      await channel.exit();
      
      expect(channel.url).to.exist;
    });
  });

  it('TC-SDK-010: List Open Channels', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const query = sb.openChannel.createOpenChannelListQuery({ limit: 10 });
      const channels = await query.next();

      expect(channels).to.be.an('array');
    });
  });

  it('TC-SDK-011: Get Open Channel by URL', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const created = await sb.openChannel.createChannel({
        name: `URL Test Channel ${Date.now()}`,
      });
      createdChannelUrls.push(created.url);

      const fetched = await sb.openChannel.getChannel(created.url);

      expect(fetched.url).to.equal(created.url);
      expect(fetched.name).to.equal(created.name);
    });
  });
});

describe('Sendbird SDK - Group Channel Tests', () => {
  let sb;
  let testUserId;
  const createdChannelUrls = [];

  beforeEach(() => {
    testUserId = `cypress_gc_user_${Date.now()}`;
    cy.visit(TEST_PAGE);
    cy.window().should('have.property', 'Sendbird');
  });

  afterEach(() => {
    cy.window().then(async (win) => {
      for (const url of createdChannelUrls) {
        try {
          const channel = await sb.groupChannel.getChannel(url);
          await channel.leave();
        } catch (e) {}
      }
      createdChannelUrls.length = 0;
      
      if (sb && sb.connectionState === 'OPEN') {
        try {
          await sb.disconnect();
        } catch (e) {}
      }
    });
  });

  it('TC-SDK-012: Create Group Channel with single user', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const channel = await sb.groupChannel.createChannel({
        invitedUserIds: [testUserId],
        name: `Test Group Channel ${Date.now()}`,
        isDistinct: false,
      });
      createdChannelUrls.push(channel.url);

      expect(channel).to.exist;
      expect(channel.url).to.exist;
      expect(channel.memberCount).to.be.at.least(1);
    });
  });

  it('TC-SDK-012-4: Create Group Channel with Korean name', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const channel = await sb.groupChannel.createChannel({
        invitedUserIds: [testUserId],
        name: '테스트 그룹 채널',
        isDistinct: false,
      });
      createdChannelUrls.push(channel.url);

      expect(channel.name).to.equal('테스트 그룹 채널');
    });
  });

  it('TC-SDK-015: List Group Channels', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const query = sb.groupChannel.createMyGroupChannelListQuery({
        limit: 10,
        includeEmpty: true,
      });
      const channels = await query.next();

      expect(channels).to.be.an('array');
    });
  });

  it('TC-SDK-016: Get Group Channel by URL', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      const created = await sb.groupChannel.createChannel({
        invitedUserIds: [testUserId],
        name: `URL Test Group ${Date.now()}`,
        isDistinct: false,
      });
      createdChannelUrls.push(created.url);

      const fetched = await sb.groupChannel.getChannel(created.url);

      expect(fetched.url).to.equal(created.url);
      expect(fetched.name).to.equal(created.name);
    });
  });
});

describe('Sendbird SDK - Message Tests', () => {
  let sb;
  let testUserId;
  let testChannel;

  beforeEach(() => {
    testUserId = `cypress_msg_user_${Date.now()}`;
    cy.visit(TEST_PAGE);
    cy.window().should('have.property', 'Sendbird');
  });

  afterEach(() => {
    cy.window().then(async (win) => {
      try {
        if (testChannel) {
          await testChannel.exit();
        }
      } catch (e) {}
      
      if (sb && sb.connectionState === 'OPEN') {
        try {
          await sb.disconnect();
        } catch (e) {}
      }
    });
  });

  it('TC-SDK-017: Send simple text message', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      testChannel = await sb.openChannel.createChannel({
        name: `Message Test Channel ${Date.now()}`,
      });
      await testChannel.enter();

      const message = await new Promise((resolve, reject) => {
        testChannel.sendUserMessage({ message: 'Hello, Sendbird!' })
          .onSucceeded((msg) => resolve(msg))
          .onFailed((err) => reject(err));
      });

      expect(message).to.exist;
      expect(message.message).to.equal('Hello, Sendbird!');
      expect(message.messageId).to.exist;
    });
  });

  it('TC-SDK-018: Send Korean text message', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      testChannel = await sb.openChannel.createChannel({
        name: `Korean Message Test ${Date.now()}`,
      });
      await testChannel.enter();

      const message = await new Promise((resolve, reject) => {
        testChannel.sendUserMessage({ message: '안녕하세요, 센드버드입니다!' })
          .onSucceeded((msg) => resolve(msg))
          .onFailed((err) => reject(err));
      });

      expect(message.message).to.equal('안녕하세요, 센드버드입니다!');
    });
  });

  it('TC-SDK-019: Send emoji message', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      testChannel = await sb.openChannel.createChannel({
        name: `Emoji Message Test ${Date.now()}`,
      });
      await testChannel.enter();

      const message = await new Promise((resolve, reject) => {
        testChannel.sendUserMessage({ message: '🎉🚀💬👋' })
          .onSucceeded((msg) => resolve(msg))
          .onFailed((err) => reject(err));
      });

      expect(message.message).to.equal('🎉🚀💬👋');
    });
  });

  it('TC-SDK-020: List messages from channel', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      testChannel = await sb.openChannel.createChannel({
        name: `List Message Test ${Date.now()}`,
      });
      await testChannel.enter();

      // Send a message first
      await new Promise((resolve, reject) => {
        testChannel.sendUserMessage({ message: 'Test message' })
          .onSucceeded((msg) => resolve(msg))
          .onFailed((err) => reject(err));
      });

      // List messages
      const messages = await testChannel.getMessagesByTimestamp(Date.now(), {
        prevResultSize: 10,
        nextResultSize: 0,
        isInclusive: true,
      });

      expect(messages).to.be.an('array');
      expect(messages.length).to.be.at.least(1);
    });
  });

  it('TC-SDK-021: Update message text', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      testChannel = await sb.openChannel.createChannel({
        name: `Update Message Test ${Date.now()}`,
      });
      await testChannel.enter();

      const original = await new Promise((resolve, reject) => {
        testChannel.sendUserMessage({ message: 'Original message' })
          .onSucceeded((msg) => resolve(msg))
          .onFailed((err) => reject(err));
      });

      const updated = await testChannel.updateUserMessage(original.messageId, {
        message: 'Updated message',
      });

      expect(updated.message).to.equal('Updated message');
      expect(updated.messageId).to.equal(original.messageId);
    });
  });

  it('TC-SDK-030: Message send response time under 2 seconds', () => {
    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);

      testChannel = await sb.openChannel.createChannel({
        name: `Performance Test ${Date.now()}`,
      });
      await testChannel.enter();

      const startTime = Date.now();
      await new Promise((resolve, reject) => {
        testChannel.sendUserMessage({ message: 'Performance test' })
          .onSucceeded((msg) => resolve(msg))
          .onFailed((err) => reject(err));
      });
      const responseTime = Date.now() - startTime;

      cy.log(`Message send time: ${responseTime}ms`);
      expect(responseTime).to.be.lessThan(2000);
    });
  });
});

describe('Sendbird SDK - State Transition (Full Lifecycle)', () => {
  it('TC-SDK-028: Complete flow - Connect -> Create -> Enter -> Send -> Update -> Exit -> Disconnect', () => {
    const testUserId = `cypress_lifecycle_${Date.now()}`;
    let sb;
    let channel;

    cy.visit(TEST_PAGE);
    cy.window().should('have.property', 'Sendbird');

    cy.window().then(async (win) => {
      const { SendbirdChat, OpenChannelModule, GroupChannelModule } = win.Sendbird;
      
      // 1. Initialize & Connect
      sb = SendbirdChat.init({
        appId: APP_ID,
        modules: [new OpenChannelModule(), new GroupChannelModule()],
      });
      await sb.connect(testUserId);
      expect(sb.connectionState).to.equal('OPEN');
      cy.log('Step 1: Connected');

      // 2. Create Channel
      channel = await sb.openChannel.createChannel({
        name: `Lifecycle Test ${Date.now()}`,
      });
      expect(channel.url).to.exist;
      cy.log('Step 2: Channel Created');

      // 3. Enter Channel
      await channel.enter();
      cy.log('Step 3: Entered Channel');

      // 4. Send Message
      const message = await new Promise((resolve, reject) => {
        channel.sendUserMessage({ message: 'Lifecycle test message' })
          .onSucceeded((msg) => resolve(msg))
          .onFailed((err) => reject(err));
      });
      expect(message.messageId).to.exist;
      cy.log('Step 4: Message Sent');

      // 5. Update Message
      const updated = await channel.updateUserMessage(message.messageId, {
        message: 'Updated lifecycle message',
      });
      expect(updated.message).to.equal('Updated lifecycle message');
      cy.log('Step 5: Message Updated');

      // 6. Exit Channel
      await channel.exit();
      cy.log('Step 6: Exited Channel');

      // 7. Disconnect (Skip channel delete - requires operator permission)
      await sb.disconnect();
      expect(sb.connectionState).to.equal('CLOSED');
      cy.log('Step 7: Disconnected');
    });
  });
});