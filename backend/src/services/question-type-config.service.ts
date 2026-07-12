import { QuestionTypeConfig, ConfigModule } from '../models/question-type-config.model';

type ConfigValues = Record<string, number>;

/**
 * Last-resort fallback used only if a (module, type) row is somehow missing
 * from the database (e.g. before the migration script has run). Steady state
 * should never rely on this — every type is expected to have a config row.
 */
export const DEFAULT_TYPE_CONFIG: Record<ConfigModule, Record<string, ConfigValues>> = {
  speaking: {
    read_aloud: { speakingTime: 40, preparationTime: 30 },
    repeat_sentence: { speakingTime: 15, preparationTime: 0 },
    describe_image: { speakingTime: 40, preparationTime: 25 },
    respond_situation: { speakingTime: 40, preparationTime: 30 },
    answer_short: { speakingTime: 10, preparationTime: 0 },
  },
  writing: {
    summarise_written_text: { timeLimit: 600, wordMin: 5, wordMax: 75 },
    write_essay: { timeLimit: 1200, wordMin: 200, wordMax: 300 },
  },
  reading: {},
  listening: {
    summarise_spoken: { timeLimit: 600, playLimit: 1 },
    mcq_multiple: { playLimit: 1 },
    fill_blanks: { playLimit: 1 },
    highlight_summary: { playLimit: 1 },
    mcq_single: { playLimit: 1 },
    select_missing: { playLimit: 1 },
    highlight_incorrect: { playLimit: 1 },
    write_dictation: { playLimit: 1 },
  },
};

function stripUndefined(values: Record<string, number | undefined>): ConfigValues {
  const result: ConfigValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/** Single (module, type) config, merged over the in-code default fallback. */
export async function getTypeConfig(module: ConfigModule, type: string): Promise<ConfigValues> {
  const doc = await QuestionTypeConfig.findOne({ module, type }).lean();
  const fallback = DEFAULT_TYPE_CONFIG[module][type] ?? {};
  if (!doc) return fallback;

  const { speakingTime, preparationTime, timeLimit, wordMin, wordMax, playLimit } = doc;
  return { ...fallback, ...stripUndefined({ speakingTime, preparationTime, timeLimit, wordMin, wordMax, playLimit }) };
}

/** Every config row for a module, keyed by type — avoids N+1 queries on list endpoints. */
export async function getTypeConfigsMap(module: ConfigModule): Promise<Record<string, ConfigValues>> {
  const docs = await QuestionTypeConfig.find({ module }).lean();
  const map: Record<string, ConfigValues> = { ...DEFAULT_TYPE_CONFIG[module] };

  for (const doc of docs) {
    const { speakingTime, preparationTime, timeLimit, wordMin, wordMax, playLimit } = doc;
    map[doc.type] = {
      ...(map[doc.type] ?? {}),
      ...stripUndefined({ speakingTime, preparationTime, timeLimit, wordMin, wordMax, playLimit }),
    };
  }

  return map;
}

/** Create or update the config for a (module, type) — the only write path. */
export async function upsertTypeConfig(
  module: ConfigModule,
  type: string,
  values: ConfigValues
): Promise<ConfigValues> {
  const doc = await QuestionTypeConfig.findOneAndUpdate(
    { module, type },
    { $set: { ...values, updatedAt: new Date() } },
    { new: true, upsert: true }
  ).lean();

  const { speakingTime, preparationTime, timeLimit, wordMin, wordMax, playLimit } = doc;
  return stripUndefined({ speakingTime, preparationTime, timeLimit, wordMin, wordMax, playLimit });
}
