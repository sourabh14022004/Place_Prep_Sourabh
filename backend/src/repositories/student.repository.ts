/**
 * backend/src/repositories/student.repository.ts
 */

import StudentProfile, { IStudentProfile } from '../models/StudentProfile';
import mongoose from 'mongoose';

export const studentRepository = {
  async findByUserId(userId: string): Promise<IStudentProfile | null> {
    return StudentProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean<IStudentProfile>();
  },

  async create(data: Partial<IStudentProfile>): Promise<IStudentProfile> {
    const profile = new StudentProfile(data);
    return profile.save() as unknown as IStudentProfile;
  },

  async updateByUserId(
    userId: string,
    data: Partial<IStudentProfile>
  ): Promise<IStudentProfile | null> {
    return StudentProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: data },
      { new: true }
    ).lean<IStudentProfile>();
  },

  /** XP leaderboard — sorted by xpTotal descending */
  async getLeaderboard(batch?: string, limit = 100): Promise<IStudentProfile[]> {
    const filter: Record<string, unknown> = {};
    if (batch) filter.batch = batch;
    return StudentProfile.find(filter)
      .sort({ xpTotal: -1 })
      .limit(limit)
      .lean<IStudentProfile[]>();
  },

  /** List all students (admin) with pagination */
  async findAll(options: {
    page: number;
    limit: number;
    search?: string;
    batch?: string;
    placementStatus?: string;
  }): Promise<{ profiles: IStudentProfile[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (options.batch) filter.batch = options.batch;
    if (options.placementStatus) filter.placementStatus = options.placementStatus;
    if (options.search) {
      // Use regex for partial matching (e.g. "Rah" finds "Rahul")
      // $text requires a text index and only matches full words — regex is more reliable
      const searchRegex = { $regex: options.search.trim(), $options: 'i' };
      filter.$or = [{ fullName: searchRegex }, { batch: searchRegex }];
    }

    const skip = (options.page - 1) * options.limit;
    const [profiles, total] = await Promise.all([
      StudentProfile.find(filter).skip(skip).limit(options.limit).lean<IStudentProfile[]>(),
      StudentProfile.countDocuments(filter),
    ]);
    return { profiles, total };
  },

  /** Projection-only: get just userIds (for broadcast notifications) — avoids loading full documents */
  async findUserIds(filter: Record<string, unknown> = {}): Promise<string[]> {
    const docs = await StudentProfile.find(filter).select('userId').lean<{ userId: mongoose.Types.ObjectId }[]>();
    return docs.map((d) => d.userId.toString());
  },

  /** Get all student profiles without pagination (for faculty matrix, leaderboard) */
  async findAllSimple(): Promise<IStudentProfile[]> {
    return StudentProfile.find().sort({ xpTotal: -1 }).lean<IStudentProfile[]>();
  },

  /** Count all active students */
  async count(): Promise<number> {
    return StudentProfile.countDocuments();
  },

  /** Count students by placement status */
  async countByPlacementStatus(status: string): Promise<number> {
    return StudentProfile.countDocuments({ placementStatus: status as any });
  },

  /** Add XP atomically */
  async addXp(userId: string, xp: number): Promise<void> {
    await StudentProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $inc: { xpTotal: xp } }
    );
  },

  /** Update streak + track historical best streak (BUG-PR1 FIX) */
  async updateStreak(userId: string, streakDays: number): Promise<void> {
    await StudentProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        $set: { currentStreakDays: streakDays, lastActiveAt: new Date() },
        // BUG-PR1 FIX: $max only updates bestStreakDays if streakDays > current best
        $max: { bestStreakDays: streakDays },
      }
    );
  },

  /**
   * Merge specific topicSelfRatings keys without overwriting the whole Map.
   * Uses dot-notation $set so unrelated existing keys are untouched.
   */
  async mergeTopicRatings(userId: string, ratings: Record<string, number>): Promise<void> {
    if (Object.keys(ratings).length === 0) return;
    const update: Record<string, number> = {};
    for (const [slug, rating] of Object.entries(ratings)) {
      update[`topicSelfRatings.${slug}`] = rating;
    }
    await StudentProfile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: update }
    );
  },

  async deleteAllSeeded(): Promise<void> {
    await StudentProfile.deleteMany({ isSeeded: true });
  },
};
