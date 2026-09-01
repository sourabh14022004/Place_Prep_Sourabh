/**
 * backend/src/repositories/experience.repository.ts
 */

import InterviewExperience, { IInterviewExperience } from '../models/InterviewExperience';
import mongoose from 'mongoose';

export const experienceRepository = {
  async findAll(options: {
    companySlug?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ experiences: IInterviewExperience[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (options.companySlug) filter.companySlug = options.companySlug;
    if (options.verified !== undefined) filter.isVerified = options.verified;

    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [experiences, total] = await Promise.all([
      InterviewExperience.find(filter)
        .sort({ upvoteCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IInterviewExperience[]>(),
      InterviewExperience.countDocuments(filter),
    ]);
    return { experiences, total };
  },

  async findById(id: string): Promise<IInterviewExperience | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return InterviewExperience.findById(id).lean<IInterviewExperience>();
  },

  async findByStudentId(studentId: string): Promise<IInterviewExperience[]> {
    return InterviewExperience.find({ studentId: new mongoose.Types.ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .lean<IInterviewExperience[]>();
  },

  async create(data: Partial<IInterviewExperience>): Promise<IInterviewExperience> {
    const exp = new InterviewExperience(data);
    return exp.save() as unknown as IInterviewExperience;
  },

  async toggleUpvote(
    id: string,
    userId: string
  ): Promise<{ upvoteCount: number; isUpvoted: boolean }> {
    const oid = new mongoose.Types.ObjectId(userId);
    const exp = await InterviewExperience.findById(id);
    if (!exp) throw new Error('Experience not found');

    const isCurrentlyUpvoted = exp.upvotedBy.some((uid) => uid.equals(oid));

    if (isCurrentlyUpvoted) {
      await InterviewExperience.findByIdAndUpdate(id, {
        $pull: { upvotedBy: oid },
        $inc: { upvoteCount: -1 },
      });
      return { upvoteCount: exp.upvoteCount - 1, isUpvoted: false };
    } else {
      await InterviewExperience.findByIdAndUpdate(id, {
        $addToSet: { upvotedBy: oid },
        $inc: { upvoteCount: 1 },
      });
      return { upvoteCount: exp.upvoteCount + 1, isUpvoted: true };
    }
  },

  async deleteAllSeeded(): Promise<void> {
    await InterviewExperience.deleteMany({ isSeeded: true });
  },
};
