import { v4 as uuidv4 } from 'uuid';

function timeStampMilliseconds(): number {
  return new Date().getTime();
}

export function MakeTimedIDUnique(): string {
  return uuidv4();
}

export function unixTimestamp(): number {
  return Math.round(timeStampMilliseconds() / 1000);
}
export function datesForCreate(): { createdAt: Date, updatedAt: Date } {
  return {
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
