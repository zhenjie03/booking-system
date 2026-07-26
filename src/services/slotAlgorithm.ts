export type Slot = { start: Date; end: Date };
export type AvailabilityWindow = { startMinute: number; endMinute: number };
export type BusyRange = { start: Date; end: Date };

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function minutesToDate(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setMinutes(minutes);
  return result;
}

export function computeCandidateSlots(
  windows: AvailabilityWindow[],
  date: Date,
  durationMinutes: number,
  bufferMinutes: number,
): Slot[] {
  const step = durationMinutes + bufferMinutes;
  const candidates: Slot[] = [];
  for (const window of windows) {
    let cursor = window.startMinute;
    while (cursor + durationMinutes <= window.endMinute) {
      candidates.push({
        start: minutesToDate(date, cursor),
        end: minutesToDate(date, cursor + durationMinutes),
      });
      cursor += step;
    }
  }
  return candidates;
}

export function filterAvailableSlots(
  candidates: Slot[],
  existingBookings: BusyRange[],
  bufferMinutes: number,
  minNoticeMinutes: number,
  now: Date,
): Slot[] {
  const bufferMs = bufferMinutes * 60 * 1000;
  const busyRanges = existingBookings.map((b) => ({
    start: new Date(b.start.getTime() - bufferMs),
    end: new Date(b.end.getTime() + bufferMs),
  }));

  const earliestBookable = new Date(now.getTime() + minNoticeMinutes * 60 * 1000);

  return candidates.filter((slot) => {
    if (slot.start < earliestBookable) return false;
    return !busyRanges.some((busy) => overlaps(slot.start, slot.end, busy.start, busy.end));
  });
}
