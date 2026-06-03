import { z } from "zod";
import { bindBackendUser, getBackendUsers } from "../api/index.js";
import { AdminLevelSchema, type AdminLevel } from "../objects/system/system-objects.js";
import type { FrontendRole } from "./config.js";

export const INVITE_CODE = "66260696";

export const AuthRoleSchema = z.enum(["player", "designer", "admin"]);

const NicknameSchema = z.string().trim().min(2, "昵称至少 2 个字符").max(20, "昵称最多 20 个字符");
const PasswordSchema = z.string().min(6, "密码至少 6 位").max(32, "密码最多 32 位");

export const LoginInputSchema = z.object({
  role: AuthRoleSchema,
  nickname: NicknameSchema,
  password: PasswordSchema,
});

export const PlayerRegisterInputSchema = z.object({
  role: z.literal("player"),
  nickname: NicknameSchema,
  password: PasswordSchema,
});

export const PrivilegedRegisterInputSchema = z.object({
  role: z.enum(["designer", "admin"]),
  nickname: NicknameSchema,
  password: PasswordSchema,
  inviteCode: z.string().min(1, "请输入验证码"),
});

export type AuthRole = z.infer<typeof AuthRoleSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type PlayerRegisterInput = z.infer<typeof PlayerRegisterInputSchema>;
export type PrivilegedRegisterInput = z.infer<typeof PrivilegedRegisterInputSchema>;
export type RegisterInput = PlayerRegisterInput | PrivilegedRegisterInput;

export type AuthUser = {
  id: string;
  nickname: string;
  role: AuthRole;
  adminLevel?: AdminLevel | undefined;
  createdAt: string;
  apiUserId?: string | undefined;
};

export type AuthUserSummary = AuthUser;

type AuthUserRecord = AuthUser & {
  password: string;
};

type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

const formatZodMessage = (error: z.ZodError) => error.issues[0]?.message ?? "输入不合法";

export const validateLoginInput = (input: LoginInput): ValidationResult<LoginInput> => {
  const parsed = LoginInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: formatZodMessage(parsed.error),
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
};

export const validateRegisterInput = (input: RegisterInput): ValidationResult<RegisterInput> => {
  const baseSchema =
    input.role === "player" ? PlayerRegisterInputSchema : PrivilegedRegisterInputSchema;

  const parsed = baseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: formatZodMessage(parsed.error),
    };
  }

  if (parsed.data.role !== "player" && parsed.data.inviteCode !== INVITE_CODE) {
    return {
      success: false,
      message: "验证码错误",
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
};

const AUTH_USERS_STORAGE_KEY = "ugc-level-platform.user-db.v1";
const LEGACY_AUTH_USERS_STORAGE_KEY = "ugc-level-platform.auth-users";
const AUTH_SESSION_STORAGE_KEY = "ugc-level-platform.current-user";
const AUTH_DB_VERSION = 1 as const;

const StoredAuthUserSchema = z.object({
  id: z.string().regex(/^\d{10}$/),
  nickname: z.string().min(1),
  role: AuthRoleSchema,
  adminLevel: AdminLevelSchema.optional(),
  createdAt: z.string().datetime({ offset: true }).optional(),
  apiUserId: z.string().min(1).optional(),
});

const AuthUserSchema = StoredAuthUserSchema.transform((user) => ({
  ...user,
  createdAt: user.createdAt ?? new Date().toISOString(),
  apiUserId: user.apiUserId,
}));

const StoredAuthUserRecordSchema = StoredAuthUserSchema.extend({
  password: z.string().min(1),
});

const AuthUserRecordSchema = StoredAuthUserRecordSchema.transform((user) => ({
  ...user,
  createdAt: user.createdAt ?? new Date().toISOString(),
  apiUserId: user.apiUserId,
}));

const AuthUserDatabaseSchema = z.object({
  version: z.literal(AUTH_DB_VERSION),
  users: z.array(AuthUserRecordSchema),
});

const LegacyAuthUsersStorageSchema = z.object({
  users: z.array(AuthUserRecordSchema),
  nextUserIndex: z.number().int().positive(),
});

const DIRECTOR_ADMIN_API_ID = "admin-director-1";
const DIRECTOR_ADMIN_SEED_NICKNAME = "001";
const DIRECTOR_ADMIN_SEED_PASSWORD = "123456";
const DEPRECATED_SEED_ACCOUNTS = [
  { role: "player", nickname: "player1" },
  { role: "designer", nickname: "designer1" },
  { role: "admin", nickname: "admin1" },
  { role: "admin", nickname: "adminDirector1" },
] satisfies Array<{ role: AuthRole; nickname: string }>;

const createTenDigitId = () =>
  `${Math.floor(Math.random() * 1_000_000_0000)}`.padStart(10, "0");

const createUniqueUserId = (existingIds: Set<string>) => {
  let nextId = createTenDigitId();

  while (existingIds.has(nextId)) {
    nextId = createTenDigitId();
  }

  return nextId;
};

const createSeedUsers = (): AuthUserRecord[] => {
  const existingIds = new Set<string>();
  const timestamp = new Date().toISOString();
  const createSeedUser = (
    role: AuthRole,
    nickname: string,
    password: string,
    apiUserId: string,
    adminLevel?: AdminLevel,
  ): AuthUserRecord => {
    const id = createUniqueUserId(existingIds);
    existingIds.add(id);
    return {
      id,
      nickname,
      password,
      role,
      adminLevel,
      createdAt: timestamp,
      apiUserId,
    };
  };

  return [
    createSeedUser("admin", DIRECTOR_ADMIN_SEED_NICKNAME, DIRECTOR_ADMIN_SEED_PASSWORD, DIRECTOR_ADMIN_API_ID, "director"),
  ];
};

const migrateUsers = (users: AuthUserRecord[]): AuthUserRecord[] => {
  const usedIds = new Set<string>();

  return users.map((user) => {
    const hasValidId = /^\d{10}$/.test(user.id) && !usedIds.has(user.id);
    const nextId = hasValidId ? user.id : createUniqueUserId(usedIds);
    const createdAt =
      typeof user.createdAt === "string" && !Number.isNaN(Date.parse(user.createdAt))
        ? user.createdAt
        : new Date().toISOString();
    usedIds.add(nextId);

    return {
      ...user,
      id: nextId,
      createdAt,
      adminLevel: user.role === "admin" ? user.adminLevel : undefined,
      apiUserId: user.apiUserId,
    };
  });
};

const seedUsers: AuthUserRecord[] = createSeedUsers();

let authUsers: AuthUserRecord[] = [...seedUsers];

const toPublicUser = (user: AuthUserRecord): AuthUser => ({
  id: user.id,
  nickname: user.nickname,
  role: user.role,
  adminLevel: user.adminLevel,
  createdAt: user.createdAt,
  apiUserId: user.apiUserId,
});

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const persistAuthUsers = () => {
  if (!canUseStorage()) {
    return;
  }

  const payload = {
    version: AUTH_DB_VERSION,
    users: authUsers,
  };
  window.localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(payload));
};

const createExportPayload = () =>
  JSON.stringify(
    {
      version: AUTH_DB_VERSION,
      users: authUsers,
    },
    null,
    2,
  );

const removeDeprecatedSeedUsers = (users: AuthUserRecord[]) =>
  users.filter((user) =>
    !DEPRECATED_SEED_ACCOUNTS.some((deprecated) => deprecated.role === user.role && deprecated.nickname === user.nickname)
  );

const mergeSeedUsers = (users: AuthUserRecord[]) => {
  let merged = removeDeprecatedSeedUsers(users);

  seedUsers.forEach((seedUser) => {
    const existingIndex = merged.findIndex(
      (candidate) =>
        candidate.apiUserId === seedUser.apiUserId ||
        (candidate.role === seedUser.role && candidate.nickname === seedUser.nickname),
    );

    if (existingIndex >= 0) {
      merged = merged.map((candidate, index) =>
        index === existingIndex
          ? {
              ...candidate,
              password: seedUser.password,
              role: seedUser.role,
              adminLevel: seedUser.adminLevel,
              apiUserId: seedUser.apiUserId,
            }
          : candidate,
      );
    } else {
      merged.push(seedUser);
    }
  });

  return merged;
};

const restoreAuthUsers = () => {
  if (!canUseStorage()) {
    return;
  }

  const raw =
    window.localStorage.getItem(AUTH_USERS_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_AUTH_USERS_STORAGE_KEY);
  if (!raw) {
    authUsers = [...seedUsers];
    persistAuthUsers();
    return;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return;
  }

  const currentDb = AuthUserDatabaseSchema.safeParse(payload);
  const legacyDb = LegacyAuthUsersStorageSchema.safeParse(payload);

  if (!currentDb.success && !legacyDb.success) {
    authUsers = [...seedUsers];
    persistAuthUsers();
    return;
  }

  const users = currentDb.success
    ? currentDb.data.users
    : legacyDb.success
      ? legacyDb.data.users
      : [];
  authUsers = migrateUsers(mergeSeedUsers(users));
  persistAuthUsers();
};

restoreAuthUsers();

export const getSeedAccountHint = (role: FrontendRole) => {
  switch (role) {
    case "player":
      return "玩家请注册新账号";
    case "designer":
      return "设计师请使用邀请码注册";
    case "admin":
      return `总监管理员测试账号：${DIRECTOR_ADMIN_SEED_NICKNAME} / ${DIRECTOR_ADMIN_SEED_PASSWORD}`;
  }
};

export const isBuiltInApiUser = (apiUserId?: string) =>
  Boolean(apiUserId && seedUsers.some((candidate) => candidate.apiUserId === apiUserId));

export const getBoundApiUserId = (user: AuthUser): string | null => {
  const apiUserId = user.apiUserId?.trim();
  return apiUserId && apiUserId.length > 0 ? apiUserId : null;
};

export const readPersistedAuthUser = (): AuthUser | null => {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  const parsed = AuthUserSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }

  const matchedUser = authUsers.find((candidate) => candidate.id === parsed.data.id);
  return matchedUser ? toPublicUser(matchedUser) : null;
};

export const persistAuthSession = (user: AuthUser | null) => {
  if (!canUseStorage()) {
    return;
  }

  if (user) {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
};

export const getAuthStorageStatus = (userId: string) => {
  const matchedUser = authUsers.find((candidate) => candidate.id === userId);

  if (!matchedUser) {
    return {
      persisted: false,
      createdAt: null,
      storageLabel: "本地用户库未找到该账号",
    };
  }

  return {
    persisted: true,
    createdAt: matchedUser.createdAt,
    storageLabel: "已保存到本地用户库",
  };
};

export const listStoredAuthUsers = (): AuthUserSummary[] =>
  [...authUsers]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((user) => toPublicUser(user));

export const exportAuthDatabase = () => createExportPayload();

export const resolveStoredAuthUser = (user: AuthUser | null): AuthUser | null => {
  if (!user) {
    return null;
  }

  const matchedUser = authUsers.find((candidate) => candidate.id === user.id);
  return matchedUser ? toPublicUser(matchedUser) : null;
};

export const attachApiUserIdToAuthUser = (
  userId: string,
  apiUserId: string,
  adminLevel?: AdminLevel,
): AuthUser | null => {
  let updatedUser: AuthUser | null = null;

  authUsers = authUsers.map((candidate) => {
    if (candidate.id !== userId) {
      return candidate;
    }

    const nextUser = {
      ...candidate,
      apiUserId,
      adminLevel: candidate.role === "admin" ? adminLevel ?? candidate.adminLevel : undefined,
    };
    updatedUser = toPublicUser(nextUser);
    return nextUser;
  });

  persistAuthUsers();

  if (updatedUser) {
    persistAuthSession(updatedUser);
  }

  return updatedUser;
};

export const ensureBackendBoundAuthUser = async (user: AuthUser): Promise<AuthUser> => {
  const boundApiUserId = getBoundApiUserId(user);
  if (boundApiUserId) {
    const backendUsers = await getBackendUsers();
    const matchedBackendUser = backendUsers.find((candidate) => candidate.id === boundApiUserId && candidate.role === user.role);
    if (matchedBackendUser) {
      const updatedUser = attachApiUserIdToAuthUser(user.id, matchedBackendUser.id, matchedBackendUser.adminLevel);
      return updatedUser ?? user;
    }
  }

  const backendUser = await bindBackendUser({
    localUserId: user.id,
    nickname: user.nickname,
    role: user.role,
  });

  const updatedUser = attachApiUserIdToAuthUser(user.id, backendUser.id, backendUser.adminLevel);
  if (!updatedUser) {
    throw new Error("Failed to update local auth session");
  }

  return updatedUser;
};

export const importAuthDatabase = (raw: string): ValidationResult<{ importedCount: number }> => {
  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    return {
      success: false,
      message: "导入文件不是有效的 JSON",
    };
  }

  const parsed = AuthUserDatabaseSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      message: "导入文件结构无效，无法识别为用户库备份",
    };
  }

  authUsers = migrateUsers(mergeSeedUsers(parsed.data.users));
  persistAuthUsers();

  return {
    success: true,
    data: {
      importedCount: parsed.data.users.length,
    },
  };
};

export const loginWithLocalAuth = (input: LoginInput): ValidationResult<AuthUser> => {
  const validated = validateLoginInput(input);
  if (!validated.success) {
    return validated;
  }

  const user = authUsers.find(
    (candidate) =>
      candidate.role === validated.data.role && candidate.nickname === validated.data.nickname,
  );

  if (!user) {
    return {
      success: false,
      message: "用户不存在",
    };
  }

  if (user.password !== validated.data.password) {
    return {
      success: false,
      message: "密码错误",
    };
  }

  return {
    success: true,
    data: toPublicUser(user),
  };
};

export const registerWithLocalAuth = async (input: RegisterInput): Promise<ValidationResult<AuthUser>> => {
  const validated = validateRegisterInput(input);
  if (!validated.success) {
    return validated;
  }

  const exists = authUsers.some(
    (candidate) =>
      candidate.role === validated.data.role && candidate.nickname === validated.data.nickname,
  );

  if (exists) {
    return {
      success: false,
      message: "该角色下昵称已存在",
    };
  }

  const existingIds = new Set(authUsers.map((candidate) => candidate.id));
  const created: AuthUserRecord = {
    id: createUniqueUserId(existingIds),
    nickname: validated.data.nickname,
    password: validated.data.password,
    role: validated.data.role,
    adminLevel: validated.data.role === "admin" ? "standard" : undefined,
    createdAt: new Date().toISOString(),
  };

  authUsers = [...authUsers, created];
  persistAuthUsers();

  if (validated.data.role === "designer" || validated.data.role === "admin") {
    try {
      const backendUser = await bindBackendUser({
        localUserId: created.id,
        nickname: created.nickname,
        role: created.role,
      });
      const boundUser = attachApiUserIdToAuthUser(created.id, backendUser.id, backendUser.adminLevel);

      if (!boundUser) {
        throw new Error("Failed to attach backend account");
      }

      return {
        success: true,
        data: boundUser,
      };
    } catch (error) {
      // 让“注册”和“后端账号分配”保持同一事务感知，失败时回滚本地账号，避免留下半完成状态。
      authUsers = authUsers.filter((candidate) => candidate.id !== created.id);
      persistAuthUsers();

      return {
        success: false,
        message: error instanceof Error ? error.message : "创建后端账号失败",
      };
    }
  }

  return {
    success: true,
    data: toPublicUser(created),
  };
};
