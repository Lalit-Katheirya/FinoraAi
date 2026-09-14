import { Types } from 'mongoose';

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
