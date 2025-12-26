import SendbirdChat, { SendbirdChatWith, User } from '@sendbird/chat';
import { OpenChannelModule, OpenChannel, OpenChannelCreateParams } from '@sendbird/chat/openChannel';
import { GroupChannelModule, GroupChannel, GroupChannelCreateParams } from '@sendbird/chat/groupChannel';

const APP_ID = process.env.SENDBIRD_APP_ID || '';

// SDK instance type with both modules
type SendbirdInstance = SendbirdChatWith<[OpenChannelModule, GroupChannelModule]>;

let sbInstance: SendbirdInstance | null = null;

/**
 * Initialize Sendbird SDK
 */
export function initSendbird(appId?: string): SendbirdInstance {
  const sb = SendbirdChat.init({
    appId: appId || APP_ID,
    modules: [new OpenChannelModule(), new GroupChannelModule()],
  }) as SendbirdInstance;
  
  sbInstance = sb;
  return sb;
}

/**
 * Get current Sendbird instance
 */
export function getSendbirdInstance(): SendbirdInstance | null {
  return sbInstance;
}

/**
 * Connect user to Sendbird server
 */
export async function connectUser(userId: string, accessToken?: string): Promise<User> {
  if (!sbInstance) {
    throw new Error('Sendbird SDK not initialized. Call initSendbird() first.');
  }
  
  if (accessToken) {
    return await sbInstance.connect(userId, accessToken);
  }
  return await sbInstance.connect(userId);
}

/**
 * Disconnect from Sendbird server
 */
export async function disconnectUser(): Promise<void> {
  if (!sbInstance) {
    throw new Error('Sendbird SDK not initialized.');
  }
  await sbInstance.disconnect();
}

/**
 * Generate unique test ID
 */
export function generateTestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Export modules for direct use
export {
  SendbirdChat,
  OpenChannelModule,
  GroupChannelModule,
  OpenChannel,
  GroupChannel,
  OpenChannelCreateParams,
  GroupChannelCreateParams,
  User,
  SendbirdInstance,
};
