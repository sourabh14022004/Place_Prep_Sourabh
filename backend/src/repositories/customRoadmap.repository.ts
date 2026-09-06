/**
 * backend/src/repositories/customRoadmap.repository.ts
 * Data access for faculty/admin-authored roadmaps and student follows.
 */

import mongoose from 'mongoose';
import CustomRoadmap, {
  ICustomRoadmap,
  CustomRoadmapStatus,
} from '../models/CustomRoadmap';
import CustomRoadmapFollow, {
  ICustomRoadmapFollow,
} from '../models/CustomRoadmapFollow';

export const customRoadmapRepository = {
  // ── roadmaps ──────────────────────────────────────────────────────────

  async create(data: Partial<ICustomRoadmap>): Promise<ICustomRoadmap> {
    const doc = new CustomRoadmap(data);
    await doc.save();
    return doc.toObject() as ICustomRoadmap;
  },

  async findById(id: string): Promise<ICustomRoadmap | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return CustomRoadmap.findById(id).lean<ICustomRoadmap>();
  },

  async findBySlug(slug: string): Promise<ICustomRoadmap | null> {
    return CustomRoadmap.findOne({ slug }).lean<ICustomRoadmap>();
  },

  /** True if any roadmap already uses this slug (optionally excluding one). */
  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const query: Record<string, unknown> = { slug };
    if (exceptId && mongoose.isValidObjectId(exceptId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(exceptId) };
    }
    return (await CustomRoadmap.countDocuments(query)) > 0;
  },

  /**
   * Student-facing discovery. 'retired' is excluded deliberately: it stays
   * available to existing followers but must not appear to new students.
   */
  async listPublished(): Promise<ICustomRoadmap[]> {
    return CustomRoadmap.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .lean<ICustomRoadmap[]>();
  },

  async listByCreator(createdBy: string): Promise<ICustomRoadmap[]> {
    if (!mongoose.isValidObjectId(createdBy)) return [];
    return CustomRoadmap.find({ createdBy: new mongoose.Types.ObjectId(createdBy) })
      .sort({ updatedAt: -1 })
      .lean<ICustomRoadmap[]>();
  },

  /** Admin view — every roadmap regardless of author or status. */
  async listAll(): Promise<ICustomRoadmap[]> {
    return CustomRoadmap.find({}).sort({ updatedAt: -1 }).lean<ICustomRoadmap[]>();
  },

  async findManyByIds(ids: mongoose.Types.ObjectId[]): Promise<ICustomRoadmap[]> {
    if (ids.length === 0) return [];
    return CustomRoadmap.find({ _id: { $in: ids } }).lean<ICustomRoadmap[]>();
  },

  async update(id: string, patch: Partial<ICustomRoadmap>): Promise<ICustomRoadmap | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return CustomRoadmap.findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean<ICustomRoadmap>();
  },

  async setStatus(id: string, status: CustomRoadmapStatus): Promise<ICustomRoadmap | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const patch: Record<string, unknown> = { status };
    if (status === 'published') patch.publishedAt = new Date();
    return CustomRoadmap.findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean<ICustomRoadmap>();
  },

  /** Hard delete. Follows are removed by the service so counts stay consistent. */
  async deleteById(id: string): Promise<void> {
    if (!mongoose.isValidObjectId(id)) return;
    await CustomRoadmap.findByIdAndDelete(id);
  },

  // ── follows ───────────────────────────────────────────────────────────

  async follow(studentId: string, roadmapId: string): Promise<ICustomRoadmapFollow | null> {
    if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(roadmapId)) return null;
    // Upsert so a double-tap on "Follow" is idempotent rather than a duplicate-key error.
    return CustomRoadmapFollow.findOneAndUpdate(
      {
        studentId: new mongoose.Types.ObjectId(studentId),
        roadmapId: new mongoose.Types.ObjectId(roadmapId),
      },
      { $setOnInsert: { startedAt: new Date() } },
      { new: true, upsert: true }
    ).lean<ICustomRoadmapFollow>();
  },

  async unfollow(studentId: string, roadmapId: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(roadmapId)) return false;
    const res = await CustomRoadmapFollow.deleteOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      roadmapId: new mongoose.Types.ObjectId(roadmapId),
    });
    return res.deletedCount > 0;
  },

  async isFollowing(studentId: string, roadmapId: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(roadmapId)) return false;
    return (
      (await CustomRoadmapFollow.countDocuments({
        studentId: new mongoose.Types.ObjectId(studentId),
        roadmapId: new mongoose.Types.ObjectId(roadmapId),
      })) > 0
    );
  },

  async listFollowsByStudent(studentId: string): Promise<ICustomRoadmapFollow[]> {
    if (!mongoose.isValidObjectId(studentId)) return [];
    return CustomRoadmapFollow.find({ studentId: new mongoose.Types.ObjectId(studentId) })
      .sort({ startedAt: -1 })
      .lean<ICustomRoadmapFollow[]>();
  },

  async countFollowers(roadmapId: string): Promise<number> {
    if (!mongoose.isValidObjectId(roadmapId)) return 0;
    return CustomRoadmapFollow.countDocuments({
      roadmapId: new mongoose.Types.ObjectId(roadmapId),
    });
  },

  async deleteAllFollows(roadmapId: string): Promise<number> {
    if (!mongoose.isValidObjectId(roadmapId)) return 0;
    const res = await CustomRoadmapFollow.deleteMany({
      roadmapId: new mongoose.Types.ObjectId(roadmapId),
    });
    return res.deletedCount ?? 0;
  },

  /** Recompute the denormalized count from the follows collection. */
  async syncFollowerCount(roadmapId: string): Promise<number> {
    const count = await this.countFollowers(roadmapId);
    await CustomRoadmap.findByIdAndUpdate(roadmapId, { $set: { followerCount: count } });
    return count;
  },
};
