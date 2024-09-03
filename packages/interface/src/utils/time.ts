import { format } from "date-fns";

export const calculateTimeLeft = (date: Date): [number, number, number, number] => {
  const timeDifference = date.getTime() - Date.now();

  if (timeDifference <= 0) {
    return [0, 0, 0, 0];
  }

  const sec = Math.floor(timeDifference / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);

  return [days, hrs % 24, min % 60, sec % 60];
};


export const formatDate = (date: Date | number): string => format(date, "dd MMM yyyy HH:mm");
