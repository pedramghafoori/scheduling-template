import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function calculateHeight(start: string, end: string): number {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return endMinutes - startMinutes;
}

export function calculateTop(start: string, gridStartHour: number): number {
  const startMinutes = timeToMinutes(start);
  const gridStartMinutes = gridStartHour * 60;
  return startMinutes - gridStartMinutes;
}

export function snapToGrid(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function generateTimeSlots(startHour: number, endHour: number, step: number) {
  const slots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
}

export function isLightColor(color: string): boolean {
  // Handle empty or invalid colors
  if (!color) return true;

  // Convert hex to RGB
  let r: number, g: number, b: number;

  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
  } else if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return true;
    [r, g, b] = rgb.map(Number);
  } else {
    return true;
  }

  // Calculate relative luminance using the sRGB color space
  // See: https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(val => {
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  return luminance > 0.5;
} 