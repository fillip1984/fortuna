import {
  addDays,
  addYears,
  eachDayOfInterval,
  format,
  getDate,
  isBefore,
  parse,
} from "date-fns";

import type { RecurrenceOption } from "~/generated/prisma/client/enums";

export const calculateNextDueDate = ({
  recurrence,
  frequency,
  currentDueDate,
}: {
  recurrence: RecurrenceOption;
  frequency: string;
  currentDueDate: Date;
}): Date | null => {
  let nextDueDate: Date | null = null;
  if (recurrence === "Daily") {
    nextDueDate = addDays(currentDueDate, parseInt(frequency));
  } else if (recurrence === "Weekly") {
    const thisWeek = eachDayOfInterval({
      start: currentDueDate,
      end: addDays(currentDueDate, 7),
    })
      .map((d) => ({ date: d, dayOfWeek: format(d, "EEE") }))
      .filter((d) => frequency.includes(d.dayOfWeek));
    console.log({ thisWeek });

    nextDueDate = thisWeek[0]?.date ?? null;
  } else if (recurrence === "Monthly") {
    const thisMonth = eachDayOfInterval({
      start: currentDueDate,
      end: addDays(currentDueDate, 31),
    })
      .map((d) => ({ date: d, dayOfMonth: getDate(d).toString() }))
      .filter((d) => frequency.includes(d.dayOfMonth));
    console.log({ thisMonth });

    nextDueDate = thisMonth[0]?.date ?? null;
  } else if (recurrence === "Yearly") {
    const [monthStr, dayStr] = frequency.split("-");
    if (monthStr && dayStr) {
      const suggestedDate =
        monthStr + "-" + dayStr + "-" + currentDueDate.getFullYear();
      console.log({ suggestedDate });
      nextDueDate = parse(suggestedDate, "MMMM-d-yyyy", new Date());
      if (isBefore(nextDueDate, currentDueDate)) {
        nextDueDate = addYears(nextDueDate, 1);
      }
    }
  } else {
    throw new Error("Unsupported recurrence option");
  }

  return nextDueDate;
};
