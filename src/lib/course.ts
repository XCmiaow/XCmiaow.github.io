import type { CollectionEntry } from 'astro:content';

import { courseFacts, courseModules } from '../data/courseCatalog';

export type CourseEntry = CollectionEntry<'course'>;

export function sortCourseEntries(entries: CourseEntry[]) {
  return [...entries].sort((left, right) => left.data.order - right.data.order);
}

export function getCourseEntry(entries: CourseEntry[], slug: string) {
  return entries.find((entry) => entry.id === slug);
}

export function validateCourse(entries: CourseEntry[]) {
  const sorted = sortCourseEntries(entries);
  const orders = new Set(sorted.map((entry) => entry.data.order));
  const ids = new Set(sorted.map((entry) => entry.id));
  const durationMinutes = sorted.reduce((total, entry) => total + entry.data.durationMinutes, 0);
  const productMinutes = sorted.reduce((total, entry) => total + entry.data.productMinutes, 0);
  const workBuddyMinutes = sorted.reduce((total, entry) => total + entry.data.workBuddyMinutes, 0);

  if (sorted.length !== courseModules.length || orders.size !== sorted.length) {
    throw new Error('课程必须包含六个顺序唯一的单元。');
  }
  if (durationMinutes !== courseFacts.totalMinutes) {
    throw new Error(`课程总时长必须为 ${courseFacts.totalMinutes} 分钟。`);
  }
  if (productMinutes < 240 || productMinutes > 300) {
    throw new Error('产品演示时间必须保持在 240–300 分钟。');
  }
  if (workBuddyMinutes > 60) {
    throw new Error('WorkBuddy 专属演示不得超过 60 分钟。');
  }
  for (const entry of sorted) {
    for (const prerequisite of entry.data.prerequisites) {
      if (!ids.has(prerequisite)) throw new Error(`${entry.id} 引用了不存在的前置单元 ${prerequisite}。`);
    }
  }

  return { sorted, durationMinutes, productMinutes, workBuddyMinutes };
}
