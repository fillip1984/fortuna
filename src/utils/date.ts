import { type RecurrenceOption } from "@prisma/client";
import { addDays, eachDayOfInterval, format } from "date-fns";

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
  } else {
    throw new Error("Unsupported recurrence option");
  }

  return nextDueDate;
};
