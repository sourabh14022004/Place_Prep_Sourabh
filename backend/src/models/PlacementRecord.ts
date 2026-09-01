import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlacementRecord extends Document {
  _id: mongoose.Types.ObjectId;
  year: number;
  companySlug: string;
  roleName: string;
  packageLpa: number;
  roundsCount: number;
  studentsSelected: number;
  branch: string;
  sourceId: number; // 51 = NST Placement Cell (per scraping doc)
  isVerified: boolean;
}

const PlacementRecordSchema = new Schema<IPlacementRecord>(
  {
    year: { type: Number, required: true, min: 2000, max: 2100 },
    companySlug: { type: String, required: true, index: true },
    roleName: { type: String, required: true },
    packageLpa: { type: Number, required: true, min: 0 },
    roundsCount: { type: Number, default: 0, min: 0 },
    studentsSelected: { type: Number, default: 0, min: 0 },
    branch: { type: String, required: true },
    sourceId: { type: Number, default: 51 },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'placement_records',
  }
);

PlacementRecordSchema.index({ year: 1, companySlug: 1 });

const PlacementRecord: Model<IPlacementRecord> =
  mongoose.models.PlacementRecord ||
  mongoose.model<IPlacementRecord>('PlacementRecord', PlacementRecordSchema);

export default PlacementRecord;
