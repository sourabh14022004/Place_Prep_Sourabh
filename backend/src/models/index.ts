/**
 * backend/src/models/index.ts
 * Barrel export — import all models from one place.
 * Usage: import { User, StudentProfile, Company } from '@/backend/src/models';
 */

export { default as User } from './User';
export { default as StudentProfile } from './StudentProfile';
export { default as FacultyProfile } from './FacultyProfile';
export { default as Company } from './Company';
export { default as Question } from './Question';
export { default as UserRoadmap } from './UserRoadmap';
export { default as QuestionCompletion } from './QuestionCompletion';
export { default as DoubtThread } from './DoubtThread';
export { default as SessionBooking } from './SessionBooking';
export { default as Notification } from './Notification';
export { default as InterviewExperience } from './InterviewExperience';
export { default as FacultyInvite } from './FacultyInvite';
export { default as Message } from './Message';
export { default as FeatureFlag } from './FeatureFlag';
// --- Phase 1: new models ---
export { default as Topic } from './Topic';
export { default as CurriculumTopic } from './CurriculumTopic';
export { default as Skill } from './Skill';
export { default as PlacementRecord } from './PlacementRecord';

// Re-export interfaces
export type { IUser } from './User';
export type { IStudentProfile } from './StudentProfile';
export type { IFacultyProfile } from './FacultyProfile';
export type { ICompany } from './Company';
export type { IQuestion } from './Question';
export type { IUserRoadmap } from './UserRoadmap';
export type { IQuestionCompletion } from './QuestionCompletion';
export type { IDoubtThread } from './DoubtThread';
export type { ISessionBooking } from './SessionBooking';
export type { INotification } from './Notification';
export type { IInterviewExperience } from './InterviewExperience';
export type { IFacultyInvite } from './FacultyInvite';
export type { IFeatureFlag, FeaturePortal } from './FeatureFlag';
// --- Phase 1: new model interfaces ---
export type { ITopic } from './Topic';
export type { ICurriculumTopic } from './CurriculumTopic';
export type { ISkill } from './Skill';
export type { IPlacementRecord } from './PlacementRecord';
export type { QuestionType, QUESTION_TYPES } from './Question';
