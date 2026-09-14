/**
 * Lightweight preference memory — goals/interaction prefs only.
 * Never store raw transaction vectors or account dumps here.
 */

export interface InteractionPreferences {
  preferredTone?: 'concise' | 'detailed' | 'coach';
  preferredCurrencyDisplay?: string;
  focusAreas?: string[];
  avoidTopics?: string[];
}

export interface GoalPreference {
  goalId: string;
  label: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface UserPreferenceMemory {
  userId: string;
  interaction: InteractionPreferences;
  goals: GoalPreference[];
  updatedAt: string;
}

export interface PreferenceStore {
  get(userId: string): Promise<UserPreferenceMemory | null>;
  save(memory: UserPreferenceMemory): Promise<void>;
}

/** In-memory store for local/dev/tests. */
export class InMemoryPreferenceStore implements PreferenceStore {
  private readonly store = new Map<string, UserPreferenceMemory>();

  async get(userId: string): Promise<UserPreferenceMemory | null> {
    return this.store.get(userId) ?? null;
  }

  async save(memory: UserPreferenceMemory): Promise<void> {
    this.store.set(memory.userId, {
      ...memory,
      updatedAt: new Date().toISOString(),
    });
  }
}

export function emptyPreferences(userId: string): UserPreferenceMemory {
  return {
    userId,
    interaction: {},
    goals: [],
    updatedAt: new Date().toISOString(),
  };
}

export function mergeInteractionPreferences(
  current: UserPreferenceMemory,
  patch: Partial<InteractionPreferences>
): UserPreferenceMemory {
  return {
    ...current,
    interaction: { ...current.interaction, ...patch },
    updatedAt: new Date().toISOString(),
  };
}
