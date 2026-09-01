/**
 * backend/src/repositories/doubt.repository.ts
 */

import DoubtThread, { IDoubtThread } from '../models/DoubtThread';
import mongoose from 'mongoose';

export const doubtRepository = {
  async findByStudentId(
    studentId: string,
    page = 1,
    limit = 20
  ): Promise<{ threads: IDoubtThread[]; total: number }> {
    const filter = { studentId: new mongoose.Types.ObjectId(studentId) };
    const skip = (page - 1) * limit;
    const [threads, total] = await Promise.all([
      DoubtThread.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IDoubtThread[]>(),
      DoubtThread.countDocuments(filter),
    ]);
    return { threads, total };
  },

  /**
   * Doubts a faculty member can see.
   *
   * Two independent grounds for visibility:
   *  1. Explicitly assigned to them (`assignedFacultyId` match) — always visible
   *     regardless of domain, since a direct assignment overrides scoping.
   *  2. Unassigned (open pool) AND tagged with one of their `doubtDomains`.
   *
   * `unscopedTags` are domains with zero assigned faculty anywhere in the
   * system; those fall back to being visible to everyone so a doubt can never
   * be stranded by an admin gap. Passing an empty array disables the fallback.
   *
   * Note the nested $or must stay inside the open-pool branch: hoisting the tag
   * filter to the top level would also hide directly-assigned doubts whose tag
   * sits outside the faculty's domains.
   */
  async findByFacultyId(
    facultyId: string,
    status?: string,
    domains: string[] = [],
    unscopedTags: string[] = []
  ): Promise<IDoubtThread[]> {
    const visibleTags = [...new Set([...domains, ...unscopedTags])];
    const openPool = [
      { assignedFacultyId: { $exists: false } },
      { assignedFacultyId: null },
    ];

    const filter: Record<string, unknown> = {
      $or: [
        { assignedFacultyId: new mongoose.Types.ObjectId(facultyId) },
        {
          $and: [
            { $or: openPool },
            { tag: { $in: visibleTags } },
          ],
        },
      ],
    };
    if (status) filter.status = status;
    return DoubtThread.find(filter).sort({ createdAt: -1 }).lean<IDoubtThread[]>();
  },

  async findAllPending(): Promise<IDoubtThread[]> {
    return DoubtThread.find({ status: 'pending' }).sort({ createdAt: 1 }).lean<IDoubtThread[]>();
  },

  async findById(id: string): Promise<IDoubtThread | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return DoubtThread.findById(id).lean<IDoubtThread>();
  },

  async create(data: Partial<IDoubtThread>): Promise<IDoubtThread> {
    const thread = new DoubtThread(data);
    return thread.save() as unknown as IDoubtThread;
  },

  async addReply(
    id: string,
    reply: {
      authorId: string;
      authorName: string;
      authorRole: 'student' | 'faculty';
      body: string;
    }
  ): Promise<IDoubtThread | null> {
    return DoubtThread.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: {
            ...reply,
            authorId: new mongoose.Types.ObjectId(reply.authorId),
            sentAt: new Date(),
          },
        },
        $set: { status: reply.authorRole === 'faculty' ? 'answered' : undefined },
      },
      { new: true }
    ).lean<IDoubtThread>();
  },

  async updateStatus(
    id: string,
    status: 'pending' | 'answered' | 'resolved'
  ): Promise<IDoubtThread | null> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'resolved') updateData.resolvedAt = new Date();
    return DoubtThread.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean<IDoubtThread>();
  },

  async countByStatus(status: string): Promise<number> {
    return DoubtThread.countDocuments({ status: status as any });
  },

  async countByStudentIdAndStatus(studentId: string, status?: string): Promise<number> {
    const filter: Record<string, unknown> = { studentId: new mongoose.Types.ObjectId(studentId) };
    if (status) filter.status = status;
    return DoubtThread.countDocuments(filter);
  },

  async countManyByStudentIds(studentIds: string[]): Promise<Record<string, number>> {
    const objectIds = studentIds.map((id) => new mongoose.Types.ObjectId(id));
    const results = await DoubtThread.aggregate([
      { $match: { studentId: { $in: objectIds } } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } }
    ]);
    const map: Record<string, number> = {};
    for (const r of results) {
      map[r._id.toString()] = r.count;
    }
    return map;
  },

  async deleteAllSeeded(): Promise<void> {
    await DoubtThread.deleteMany({ isSeeded: true });
  },
};
