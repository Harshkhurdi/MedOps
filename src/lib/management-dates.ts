import { AppError } from "./errors";
export function reportDates(params: URLSearchParams) {
  const from = params.get("from"),
    to = params.get("to");
  const start = from ? new Date(from + "T00:00:00Z") : undefined,
    end = to ? new Date(to + "T23:59:59.999Z") : undefined;
  if ((from&&(!/^\d{4}-\d{2}-\d{2}$/.test(from)||(!start||isNaN(+start)||start.toISOString().slice(0,10)!==from)))||(to&&(!/^\d{4}-\d{2}-\d{2}$/.test(to)||(!end||isNaN(+end)||end.toISOString().slice(0,10)!==to))))throw new AppError(400,"Choose valid calendar dates");
  if (
    (start && isNaN(+start)) ||
    (end && isNaN(+end)) ||
    (start && end && start > end)
  )
    throw new AppError(400, "Choose a valid date range");
  return { start, end };
}
