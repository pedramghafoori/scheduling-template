import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { GRID_START_HOUR, HOUR_HEIGHT } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getContrastText = (bgColor: string): string => {
  // Convert hex to RGB
  const hex = bgColor.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export const timeToYPos = (minutes: number): number => {
  const minutesFromStart = minutes - (GRID_START_HOUR * 60);
  return minutesFromStart; // 1 minute = 1px with 60px per hour
};

export const yPosToTime = (yPos: number, offsetY: number = 0): number => {
  const adjustedY = Math.max(0, yPos);
  const minutesFromStart = adjustedY; // 1px = 1 minute with 60px per hour
  return (GRID_START_HOUR * 60) + minutesFromStart;
};

export const snapToGrid = (minutes: number): number => {
  // Snap to 15-minute intervals
  return Math.round(minutes / 15) * 15;
};

export const createDragImage = (): HTMLImageElement => {
  // Create an empty 1x1 transparent image for drag ghost
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  return img;
};

export const getRemainingHours = (totalHours: number, scheduledMinutes: number): number => {
  const scheduledHours = scheduledMinutes / 60;
  return Math.max(0, totalHours - scheduledHours);
};
