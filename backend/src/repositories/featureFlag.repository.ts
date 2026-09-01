/**
 * backend/src/repositories/featureFlag.repository.ts
 */

import FeatureFlag, { IFeatureFlag, FeaturePortal } from '../models/FeatureFlag';

export interface FeatureFlagDefinition {
  key: string;
  portal: FeaturePortal;
  label: string;
  description: string;
  group: string;
}

export const featureFlagRepository = {
  async findAll(): Promise<IFeatureFlag[]> {
    return FeatureFlag.find().sort({ portal: 1, group: 1, label: 1 }).lean<IFeatureFlag[]>();
  },

  async findByKey(key: string): Promise<IFeatureFlag | null> {
    return FeatureFlag.findOne({ key }).lean<IFeatureFlag>();
  },

  async upsertMany(defs: FeatureFlagDefinition[]): Promise<void> {
    const ops = defs.map((d) => ({
      updateOne: {
        filter: { key: d.key },
        // Only set metadata fields on insert — never clobber an admin's
        // `enabled` choice when the definition list changes.
        update: {
          $setOnInsert: { ...d, enabled: true },
        },
      },
    }));
    if (ops.length) await FeatureFlag.bulkWrite(ops, { ordered: false });
  },

  async setEnabled(key: string, enabled: boolean): Promise<IFeatureFlag | null> {
    return FeatureFlag.findOneAndUpdate(
      { key },
      { $set: { enabled } },
      { new: true, lean: true }
    ).lean<IFeatureFlag | null>();
  },

  async deleteStale(validKeys: string[]): Promise<void> {
    await FeatureFlag.deleteMany({ key: { $nin: validKeys } });
  },
};
