import { type RecurrenceOption } from "@prisma/client";
import {
  addDays,
  closestTo,
  isPast,
  isToday,
  nextFriday,
  nextMonday,
  nextSaturday,
  nextSunday,
  nextThursday,
  nextTuesday,
  nextWednesday,
  previousFriday,
  previousMonday,
  previousSaturday,
  previousSunday,
  previousThursday,
  previousTuesday,
  previousWednesday,
  startOfDay,
} from "date-fns";

export const calculateNextDueDate = ({
  recurrence,
  frequency,
  currentDueDate,
}: {
  recurrence: RecurrenceOption;
  frequency: string;
  currentDueDate: Date;
}) => {
  if (recurrence === "Daily") {
    const nextDueDate = addDays(currentDueDate, parseInt(frequency));
    if (!isToday(nextDueDate) && isPast(nextDueDate)) {
      // overdue, next due date should be today
      return new Date();
    }

    return nextDueDate;
  } else if (recurrence === "Weekly") {
    // const sunday = isSunday(new Date())
    //   ? new Date()
    //   : previousSunday(new Date());
    // const saturday = nextSaturday(new Date());
    const today = startOfDay(new Date());
    const nextDueDateCandidates: Date[] = Array.from(
      { length: 7 },
      () => today,
    );
    // assign dates for each weekday (0 = Sunday ... 6 = Saturday)
    nextDueDateCandidates[0] = isPast(previousSunday(today))
      ? nextSunday(today)
      : previousSunday(today);
    nextDueDateCandidates[1] = isPast(previousMonday(today))
      ? nextMonday(today)
      : previousMonday(today);
    nextDueDateCandidates[2] = isPast(previousTuesday(today))
      ? nextTuesday(today)
      : previousTuesday(today);
    nextDueDateCandidates[3] = isPast(previousWednesday(today))
      ? nextWednesday(today)
      : previousWednesday(today);
    nextDueDateCandidates[4] = isPast(previousThursday(today))
      ? nextThursday(today)
      : previousThursday(today);
    nextDueDateCandidates[5] = isPast(previousFriday(today))
      ? nextFriday(today)
      : previousFriday(today);
    nextDueDateCandidates[6] = isPast(previousSaturday(today))
      ? nextSaturday(today)
      : previousSaturday(today);

    console.log("nextDueDateCandidates", nextDueDateCandidates);
    const future = nextDueDateCandidates.filter((d) => !isPast(d));
    return closestTo(today, future) ?? null;
  }

  throw new Error("Unsupported recurrence option");
};
