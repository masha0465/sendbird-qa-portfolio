/**
 * Sendbird Platform API - User API Test Suite
 * 
 * Test Design Techniques Applied:
 * - Equivalence Partitioning: Valid/Invalid input classes
 * - Boundary Value Analysis: Max length, empty values
 * - Error Guessing: Common error scenarios
 * - State Transition: User lifecycle (create -> update -> delete)
 * - Negative Testing: Invalid inputs, unauthorized access
 * - Data-Driven Testing: Multiple test data sets
 * 
 * API Reference: https://sendbird.com/docs/chat/platform-api/v3/user/creating-users/create-a-user
 * Error Codes: https://sendbird.com/docs/chat/platform-api/v3/error-codes
 */

import { test, expect } from '@playwright/test';
import { UserAPI, generateTestId } from '../utils/sendbird-api';

// Test Data Constants based on API documentation
const MAX_USER_ID_LENGTH = 80;
const MAX_NICKNAME_LENGTH = 80;
const MAX_PROFILE_URL_LENGTH = 2048;

test.describe('User API - Create User Tests', () => {
  const createdUserIds: string[] = [];

  test.afterEach(async () => {
    for (const userId of createdUserIds) {
      try {
        await UserAPI.delete(userId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdUserIds.length = 0;
  });

  test.describe('Positive Tests - Valid Input', () => {
    
    test('TC-USER-001: Create user with minimum required fields', async () => {
      const userId = generateTestId('user');
      const nickname = 'TestUser';

      const response = await UserAPI.create(userId, nickname);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.user_id).toBe(userId);
      expect(response.data.nickname).toBe(nickname);
      expect(response.data.is_active).toBe(true);
      expect(response.data.profile_url).toBe('');
    });

    test('TC-USER-002: Create user with profile URL', async () => {
      const userId = generateTestId('user');
      const nickname = 'UserWithProfile';
      const profileUrl = 'https://example.com/profile.png';

      const response = await UserAPI.create(userId, nickname, profileUrl);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.profile_url).toBe(profileUrl);
    });

    test('TC-USER-003: Create user with Korean nickname', async () => {
      const userId = generateTestId('user');
      const nickname = '테스트유저';

      const response = await UserAPI.create(userId, nickname);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.nickname).toBe(nickname);
    });

    test('TC-USER-004: Create user with emoji in nickname', async () => {
      const userId = generateTestId('user');
      const nickname = 'User🎉Test👍';

      const response = await UserAPI.create(userId, nickname);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.nickname).toBe(nickname);
    });
  });

  test.describe('Boundary Value Analysis', () => {
    
    test('TC-USER-005: Create user with user_id at maximum length (80 chars)', async () => {
      const userId = 'u'.repeat(MAX_USER_ID_LENGTH);
      const nickname = 'MaxLengthUser';

      const response = await UserAPI.create(userId, nickname);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.user_id.length).toBe(MAX_USER_ID_LENGTH);
    });

    test('TC-USER-006: Create user with nickname at maximum length (80 chars)', async () => {
      const userId = generateTestId('user');
      const nickname = 'N'.repeat(MAX_NICKNAME_LENGTH);

      const response = await UserAPI.create(userId, nickname);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.nickname.length).toBe(MAX_NICKNAME_LENGTH);
    });

    test('TC-USER-007: Create user with single character user_id', async () => {
      const userId = 'A';
      const nickname = 'SingleCharUser';

      const response = await UserAPI.create(userId, nickname);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.user_id).toBe(userId);
    });

    test('TC-USER-008: Create user with single character nickname', async () => {
      const userId = generateTestId('user');
      const nickname = 'X';

      const response = await UserAPI.create(userId, nickname);
      createdUserIds.push(userId);

      expect(response.status).toBe(200);
      expect(response.data.nickname).toBe(nickname);
    });
  });

  test.describe('Negative Tests - Invalid Input', () => {
    
    test('TC-USER-009: Fail to create user with duplicate user_id (Error 400202)', async () => {
      const userId = generateTestId('user');
      await UserAPI.create(userId, 'FirstUser');
      createdUserIds.push(userId);

      try {
        await UserAPI.create(userId, 'DuplicateUser');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.code).toBe(400202); // ResourceAlreadyExists
      }
    });

    test('TC-USER-010: Fail to create user with user_id exceeding max length', async () => {
      const userId = 'a'.repeat(MAX_USER_ID_LENGTH + 1);
      const nickname = 'ExceedLengthUser';

      try {
        await UserAPI.create(userId, nickname);
        createdUserIds.push(userId);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect([400305, 400110]).toContain(error.response.data.code);
      }
    });

    test('TC-USER-011: Fail to create user with empty user_id', async () => {
      try {
        await UserAPI.create('', 'EmptyIdUser');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect([400105, 400151, 400111]).toContain(error.response.data.code);
      }
    });
  });
});

test.describe('User API - Read User Tests', () => {
  let testUserId: string;

  test.beforeAll(async () => {
    testUserId = generateTestId('read_test_user');
    await UserAPI.create(testUserId, 'ReadTestUser', 'https://example.com/avatar.png');
  });

  test.afterAll(async () => {
    try {
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-USER-012: Get existing user by user_id', async () => {
    const response = await UserAPI.get(testUserId);

    expect(response.status).toBe(200);
    expect(response.data.user_id).toBe(testUserId);
    expect(response.data.nickname).toBe('ReadTestUser');
    expect(response.data.is_active).toBe(true);
  });

  test('TC-USER-013: Verify user response contains all expected fields', async () => {
    const response = await UserAPI.get(testUserId);

    expect(response.data).toHaveProperty('user_id');
    expect(response.data).toHaveProperty('nickname');
    expect(response.data).toHaveProperty('profile_url');
    expect(response.data).toHaveProperty('is_online');
    expect(response.data).toHaveProperty('is_active');
    expect(response.data).toHaveProperty('last_seen_at');
    expect(response.data).toHaveProperty('metadata');
  });

  test('TC-USER-014: Fail to get non-existent user (Error 400201/400301)', async () => {
    const nonExistentUserId = 'non_existent_user_' + Date.now();

    try {
      await UserAPI.get(nonExistentUserId);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      // 400201: ResourceNotFound, 400301: UserNotFound
      expect([400201, 400301]).toContain(error.response.data.code);
    }
  });
});

test.describe('User API - Update User Tests', () => {
  let testUserId: string;

  test.beforeEach(async () => {
    testUserId = generateTestId('update_test_user');
    await UserAPI.create(testUserId, 'OriginalNickname');
  });

  test.afterEach(async () => {
    try {
      await UserAPI.delete(testUserId);
    } catch (error) {
      // Ignore
    }
  });

  test('TC-USER-015: Update user nickname', async () => {
    const newNickname = 'UpdatedNickname';
    const response = await UserAPI.update(testUserId, newNickname);

    expect(response.status).toBe(200);
    expect(response.data.nickname).toBe(newNickname);
  });

  test('TC-USER-016: Update user profile URL', async () => {
    const newProfileUrl = 'https://example.com/new-avatar.png';
    const response = await UserAPI.update(testUserId, undefined, newProfileUrl);

    expect(response.status).toBe(200);
    expect(response.data.profile_url).toBe(newProfileUrl);
  });

  test('TC-USER-017: Fail to update non-existent user (Error 400201/400301)', async () => {
    const nonExistentUserId = 'non_existent_' + Date.now();

    try {
      await UserAPI.update(nonExistentUserId, 'NewNickname');
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect([400201, 400301]).toContain(error.response.data.code);
    }
  });
});

test.describe('User API - Delete User Tests', () => {
  
  test('TC-USER-018: Delete existing user and verify', async () => {
    const userId = generateTestId('delete_test_user');
    await UserAPI.create(userId, 'DeleteTestUser');

    const deleteResponse = await UserAPI.delete(userId);
    expect(deleteResponse.status).toBe(200);

    try {
      await UserAPI.get(userId);
      expect(true).toBe(false);
    } catch (error: any) {
      // 400201: ResourceNotFound, 400301: UserNotFound
      expect([400201, 400301]).toContain(error.response.data.code);
    }
  });

  test('TC-USER-019: Fail to delete non-existent user (Error 400201/400301)', async () => {
    const nonExistentUserId = 'non_existent_delete_' + Date.now();

    try {
      await UserAPI.delete(nonExistentUserId);
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect([400201, 400301]).toContain(error.response.data.code);
    }
  });

  test('TC-USER-020: Verify deleted user_id can be reused', async () => {
    const userId = generateTestId('reuse_test');
    
    await UserAPI.create(userId, 'FirstCreate');
    await UserAPI.delete(userId);
    
    const response = await UserAPI.create(userId, 'SecondCreate');
    expect(response.status).toBe(200);
    
    await UserAPI.delete(userId);
  });
});

test.describe('User API - List Users Tests', () => {
  const testUserIds: string[] = [];

  test.beforeAll(async () => {
    for (let i = 0; i < 3; i++) {
      const userId = generateTestId(`list_test_user_${i}`);
      await UserAPI.create(userId, `ListTestUser${i}`);
      testUserIds.push(userId);
    }
  });

  test.afterAll(async () => {
    for (const userId of testUserIds) {
      try {
        await UserAPI.delete(userId);
      } catch (error) {
        // Ignore
      }
    }
  });

  test('TC-USER-021: List users with default limit', async () => {
    const response = await UserAPI.list();

    expect(response.status).toBe(200);
    expect(response.data.users).toBeDefined();
    expect(Array.isArray(response.data.users)).toBe(true);
  });

  test('TC-USER-022: List users with custom limit', async () => {
    const limit = 5;
    const response = await UserAPI.list(limit);

    expect(response.status).toBe(200);
    expect(response.data.users.length).toBeLessThanOrEqual(limit);
  });
});

test.describe('User API - State Transition (Full Lifecycle)', () => {
  
  test('TC-USER-023: Complete user lifecycle - Create -> Read -> Update -> Delete', async () => {
    const userId = generateTestId('lifecycle_test');
    
    // 1. Create
    const createResponse = await UserAPI.create(userId, 'InitialNickname');
    expect(createResponse.status).toBe(200);
    
    // 2. Read
    const readResponse = await UserAPI.get(userId);
    expect(readResponse.data.nickname).toBe('InitialNickname');
    
    // 3. Update
    const updateResponse = await UserAPI.update(userId, 'UpdatedNickname');
    expect(updateResponse.data.nickname).toBe('UpdatedNickname');
    
    // 4. Verify Update
    const verifyResponse = await UserAPI.get(userId);
    expect(verifyResponse.data.nickname).toBe('UpdatedNickname');
    
    // 5. Delete
    const deleteResponse = await UserAPI.delete(userId);
    expect(deleteResponse.status).toBe(200);
    
    // 6. Verify Deletion
    try {
      await UserAPI.get(userId);
      expect(true).toBe(false);
    } catch (error: any) {
      expect([400201, 400301]).toContain(error.response.data.code);
    }
  });
});

test.describe('User API - Data-Driven Tests', () => {
  const validUserData = [
    { id: 'alphanumeric123', nick: 'AlphaNumeric', desc: 'alphanumeric' },
    { id: 'user-with-dash', nick: 'DashUser', desc: 'with dash' },
    { id: 'user_underscore', nick: 'UnderscoreUser', desc: 'with underscore' },
    { id: 'user.with.dot', nick: 'DotUser', desc: 'with dot' },
  ];

  for (const data of validUserData) {
    test(`TC-USER-024-${data.desc}: Create user ${data.desc}`, async () => {
      const response = await UserAPI.create(data.id, data.nick);

      expect(response.status).toBe(200);
      expect(response.data.user_id).toBe(data.id);

      await UserAPI.delete(data.id);
    });
  }
});
