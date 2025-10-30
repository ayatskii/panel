import { format as formatDateFns } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'
import i18n from '@/i18n'

export function formatDate(date: Date | string | number, pattern: string): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const locale = i18n.language.startsWith('ru') ? ru : enUS
  return formatDateFns(d, pattern, { locale })
}


