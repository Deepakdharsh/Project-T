import { ApiError } from '../utils/apiError.js';
import { ClosureModel } from '../models/Closure.js';

export async function listAllClosures() {
  const items = await ClosureModel.find().sort({ date: 1, startHour: 1 }).lean();
  return items.map((c: any) => ({
    id: c._id.toString(),
    type: c.type,
    date: c.date,
    startHour: c.startHour,
    endHour: c.endHour,
    reason: c.reason,
    note: c.note,
  }));
}

export async function createClosure(input: {
  type: 'full' | 'partial';
  date: string;
  startHour?: number;
  endHour?: number;
  reason: string;
  note?: string;
}) {
  if (input.type === 'partial') {
    if (input.startHour === undefined || input.endHour === undefined) {
      throw new ApiError(400, 'Partial closure requires startHour and endHour');
    }
    if (input.startHour >= input.endHour) throw new ApiError(400, 'endHour must be after startHour');
  }

  const doc = await ClosureModel.create(input);
  return {
    id: doc._id.toString(),
    type: doc.type,
    date: doc.date,
    startHour: doc.startHour,
    endHour: doc.endHour,
    reason: doc.reason,
    note: doc.note,
  };
}

export async function deleteClosure(closureId: string) {
  await ClosureModel.deleteOne({ _id: closureId });
}


