import { z } from "zod";

// Validate before constructing a Date: JavaScript normalizes impossible dates.
// Explicit offsets keep imported timestamps independent of the server timezone.
export const calendarDate = z.union([
  z.date(),
  z.iso.date().transform((value) => new Date(value)),
  z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
]);
