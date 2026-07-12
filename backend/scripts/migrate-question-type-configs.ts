// One-time migration — seeds a QuestionTypeConfig row per (module, type) from
// existing question data, so the new type-level config has a sensible starting
// value before any backend code switches to reading it. Safe to re-run: uses
// $setOnInsert only, so it NEVER overwrites a config row that already exists.
// Run with: npm run migrate:type-configs
import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '../src/config/env';

async function mostCommonValue<T extends mongoose.Document>(
  Model: mongoose.Model<T>,
  type: string,
  field: string
): Promise<number | null> {
  const result = await Model.aggregate([
    { $match: { type, [field]: { $ne: null } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);
  return result.length > 0 ? (result[0]._id as number) : null;
}

async function migrate(): Promise<void> {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
  await mongoose.connect(env.mongoUri);

  const { QuestionTypeConfig, DEFAULT_TYPE_CONFIG } = await import('../src/services/question-type-config.service').then(
    async (svc) => ({
      QuestionTypeConfig: (await import('../src/models/question-type-config.model')).QuestionTypeConfig,
      DEFAULT_TYPE_CONFIG: svc.DEFAULT_TYPE_CONFIG,
    })
  );
  const { SpeakingQuestion } = await import('../src/models/speaking-question.model');
  const { WritingQuestion } = await import('../src/models/writing-question.model');
  const { ListeningQuestion } = await import('../src/models/listening-question.model');

  const summary: Array<{ module: string; type: string; values: Record<string, number>; source: string }> = [];

  async function seed(
    module: 'speaking' | 'writing' | 'listening',
    type: string,
    Model: mongoose.Model<any>,
    fields: string[]
  ): Promise<void> {
    const existing = await QuestionTypeConfig.findOne({ module, type });
    if (existing) {
      summary.push({ module, type, values: {}, source: 'already exists — skipped' });
      return;
    }

    const defaults = DEFAULT_TYPE_CONFIG[module][type] ?? {};
    const values: Record<string, number> = {};
    let derivedCount = 0;

    for (const field of fields) {
      const derived = await mostCommonValue(Model, type, field);
      if (derived !== null) {
        values[field] = derived;
        derivedCount += 1;
      } else if (defaults[field] !== undefined) {
        values[field] = defaults[field];
      }
    }

    await QuestionTypeConfig.updateOne(
      { module, type },
      { $setOnInsert: { module, type, ...values } },
      { upsert: true }
    );

    summary.push({
      module,
      type,
      values,
      source: derivedCount > 0 ? `derived from existing questions (${derivedCount}/${fields.length} fields)` : 'fallback default (no questions yet)',
    });
  }

  await seed('speaking', 'read_aloud', SpeakingQuestion, ['speakingTime', 'preparationTime']);
  await seed('speaking', 'repeat_sentence', SpeakingQuestion, ['speakingTime', 'preparationTime']);
  await seed('speaking', 'describe_image', SpeakingQuestion, ['speakingTime', 'preparationTime']);
  await seed('speaking', 'respond_situation', SpeakingQuestion, ['speakingTime', 'preparationTime']);
  await seed('speaking', 'answer_short', SpeakingQuestion, ['speakingTime', 'preparationTime']);

  await seed('writing', 'summarise_written_text', WritingQuestion, ['timeLimit', 'wordMin', 'wordMax']);
  await seed('writing', 'write_essay', WritingQuestion, ['timeLimit', 'wordMin', 'wordMax']);

  await seed('listening', 'summarise_spoken', ListeningQuestion, ['timeLimit', 'playLimit']);
  await seed('listening', 'mcq_multiple', ListeningQuestion, ['playLimit']);
  await seed('listening', 'fill_blanks', ListeningQuestion, ['playLimit']);
  await seed('listening', 'highlight_summary', ListeningQuestion, ['playLimit']);
  await seed('listening', 'mcq_single', ListeningQuestion, ['playLimit']);
  await seed('listening', 'select_missing', ListeningQuestion, ['playLimit']);
  await seed('listening', 'highlight_incorrect', ListeningQuestion, ['playLimit']);
  await seed('listening', 'write_dictation', ListeningQuestion, ['playLimit']);

  console.log('\nQuestionTypeConfig migration summary:');
  console.table(
    summary.map((s) => ({ module: s.module, type: s.type, values: JSON.stringify(s.values), source: s.source }))
  );

  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
