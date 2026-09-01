/**
 * backend/src/repositories/roadmap.repository.ts
 */

import UserRoadmap, { IUserRoadmap } from '../models/UserRoadmap';
import mongoose from 'mongoose';

export const roadmapRepository = {
  async findByStudentId(studentId: string): Promise<IUserRoadmap[]> {
    return UserRoadmap.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      isActive: true,
    })
      .sort({ addedAt: -1 })
      .lean<IUserRoadmap[]>();
  },

  async findById(id: string): Promise<IUserRoadmap | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return UserRoadmap.findById(id).lean<IUserRoadmap>();
  },

  async findByStudentAndCompany(
    studentId: string,
    companySlug: string
  ): Promise<IUserRoadmap | null> {
    return UserRoadmap.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      companySlug,
      isActive: true,
    }).lean<IUserRoadmap>();
  },

  async deleteByStudentAndCompany(
    studentId: string,
    companySlug: string
  ): Promise<void> {
    await UserRoadmap.findOneAndDelete({
      studentId: new mongoose.Types.ObjectId(studentId),
      companySlug,
    });
  },

  async create(data: Partial<IUserRoadmap>): Promise<IUserRoadmap> {
    const roadmap = new UserRoadmap(data);
    return roadmap.save() as unknown as IUserRoadmap;
  },

  /** Increment doneQuestions on a week, mark done, and unlock the next week */
  async incrementWeekProgress(
    roadmapId: string,
    weekNumber: number
  ): Promise<void> {
    const roadmap = await UserRoadmap.findById(roadmapId);
    if (!roadmap) return;

    const week = roadmap.weeks.find((w) => w.weekNumber === weekNumber);
    if (week && week.doneQuestions < week.totalQuestions) {
      week.doneQuestions += 1;
      if (week.doneQuestions >= week.totalQuestions) {
        week.status = 'done';
        // BUG-R5 FIX: Unlock next week — was missing, caused all weeks beyond Week 1 to stay locked permanently
        const nextWeek = roadmap.weeks.find((w) => w.weekNumber === weekNumber + 1);
        if (nextWeek && nextWeek.status === 'locked') {
          nextWeek.status = 'active';
          roadmap.currentWeek = weekNumber + 1;
        }
      }
    }

    // Recalculate overall pct
    const totalQuestions = roadmap.weeks.reduce((acc, w) => acc + w.totalQuestions, 0);
    const doneQuestions = roadmap.weeks.reduce((acc, w) => acc + w.doneQuestions, 0);
    roadmap.pctComplete =
      totalQuestions > 0 ? Math.round((doneQuestions / totalQuestions) * 100) : 0;

    // BUG-PR2 FIX: Update lastActive so Progress page shows real last-practiced time
    (roadmap as any).lastActive = new Date();

    await roadmap.save();
  },

  /** Find all active roadmaps across all students (for analytics/rankings) */
  async findAll(): Promise<IUserRoadmap[]> {
    return UserRoadmap.find({ isActive: true }).lean<IUserRoadmap[]>();
  },

  async deleteAllSeeded(): Promise<void> {
    await UserRoadmap.deleteMany({ isSeeded: true });
  },

  async deleteByStudentId(studentId: string): Promise<void> {
    await UserRoadmap.deleteMany({ studentId: new mongoose.Types.ObjectId(studentId) });
  },
};
