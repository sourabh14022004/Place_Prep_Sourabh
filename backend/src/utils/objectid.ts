/**
 * backend/src/utils/objectid.ts
 *
 * SINGLE-SOURCE ObjectId helpers.
 *
 * Portal code must NEVER `import mongoose from 'mongoose'` directly: if a
 * portal resolves a different mongoose/bson copy than placeprep-backend
 * (the exact bug that caused "Unsupported BSON version" crashes), ObjectIds
 * created on one copy get passed into queries executed by the other and blow
 * up at runtime. Always import these helpers from 'placeprep-backend'.
 */

import mongoose from 'mongoose';

export const isValidObjectId = (value: string): boolean =>
  mongoose.isValidObjectId(value);

export const toObjectId = (value: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(value);
