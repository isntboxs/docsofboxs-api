import * as HttpStatusCodes from '@/constants/http-status-codes';
import * as HttpStatusPhrases from '@/constants/http-status-phrases';

const statusMap: Record<number, string> = {};

Object.entries(HttpStatusCodes).forEach(([key, value]) => {
  statusMap[value] = HttpStatusPhrases[key as keyof typeof HttpStatusPhrases];
});

export const getStatusPhrase = (statusCode: number): string => {
  return statusMap[statusCode] ?? 'Unknown status';
};
