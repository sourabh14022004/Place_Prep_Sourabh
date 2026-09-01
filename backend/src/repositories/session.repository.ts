/**
 * backend/src/repositories/session.repository.ts
 */

import SessionBooking, { ISessionBooking } from '../models/SessionBooking';
import mongoose from 'mongoose';

export const sessionRepository = {
  async findByStudentId(studentId: string): Promise<ISessionBooking[]> {
    return SessionBooking.find({ studentId: new mongoose.Types.ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .lean<ISessionBooking[]>();
  },

  async findByFacultyId(
    facultyId: string,
    status?: string
  ): Promise<ISessionBooking[]> {
    const filter: Record<string, unknown> = {
      facultyId: new mongoose.Types.ObjectId(facultyId),
    };
    if (status) filter.status = status;
    return SessionBooking.find(filter).sort({ createdAt: -1 }).lean<ISessionBooking[]>();
  },

  async findById(id: string): Promise<ISessionBooking | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return SessionBooking.findById(id).lean<ISessionBooking>();
  },

  async findAll(options: { page?: number; limit?: number }): Promise<{
    sessions: ISessionBooking[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      SessionBooking.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean<ISessionBooking[]>(),
      SessionBooking.countDocuments(),
    ]);
    return { sessions, total };
  },

  async create(data: Partial<ISessionBooking>): Promise<ISessionBooking> {
    const session = new SessionBooking(data);
    return session.save() as unknown as ISessionBooking;
  },

  async updateById(
    id: string,
    data: Partial<ISessionBooking>
  ): Promise<ISessionBooking | null> {
    return SessionBooking.findByIdAndUpdate(id, { $set: data }, { new: true }).lean<ISessionBooking>();
  },

  async countByStatus(status: string): Promise<number> {
    return SessionBooking.countDocuments({ status: status as any });
  },

  async getFacultySessionsByStatus(
    facultyId: string,
    status: string
  ): Promise<ISessionBooking[]> {
    return SessionBooking.find({
      facultyId: new mongoose.Types.ObjectId(facultyId),
      status: status as any,
    })
      .sort({ createdAt: -1 })
      .lean<ISessionBooking[]>();
  },

  async countByStudentId(studentId: string): Promise<number> {
    if (!mongoose.isValidObjectId(studentId)) return 0;
    return SessionBooking.countDocuments({
      studentId: new mongoose.Types.ObjectId(studentId),
    });
  },

  async countManyByStudentIds(studentIds: string[]): Promise<Record<string, number>> {
    const objectIds = studentIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const results = await SessionBooking.aggregate([
      { $match: { studentId: { $in: objectIds } } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } },
    ]);
    const map: Record<string, number> = {};
    for (const r of results) {
      map[r._id.toString()] = r.count;
    }
    return map;
  },

  async countByFacultyId(facultyId: string): Promise<number> {
    if (!mongoose.isValidObjectId(facultyId)) return 0;
    return SessionBooking.countDocuments({
      facultyId: new mongoose.Types.ObjectId(facultyId),
    });
  },

  async getWeeklySessionCounts(weeks: number = 4): Promise<{ week: string; count: number }[]> {
    const now = new Date();
    const result = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const count = await SessionBooking.countDocuments({ createdAt: { $gte: start, $lt: end } });
      result.push({ week: `W${weeks - i}`, count });
    }
    return result;
  },

  async getAvgSatisfaction(): Promise<number | null> {
    const result = await SessionBooking.aggregate([
      { $match: { status: 'completed', satisfactionScore: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$satisfactionScore' } } },
    ]);
    return result.length > 0 ? Math.round((result[0].avg ?? 0) * 10) / 10 : null;
  },

  async deleteAllSeeded(): Promise<void> {
    await SessionBooking.deleteMany({ isSeeded: true });
  },

};
