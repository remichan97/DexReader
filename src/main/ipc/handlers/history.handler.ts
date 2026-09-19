import { isGetActiveDatesCommand } from '../../settings/validators/command.validator'
import { wrapIpcHandler } from '../wrap-handler'
import { historyRepo } from '../../database/repositories/history.repo'

export function registerHistoryHandler(): void {
  wrapIpcHandler('history:get-active-dates', async (_, command: unknown) => {
    if (!isGetActiveDatesCommand(command)) {
      throw new TypeError('Invalid command for getting active dates')
    }

    return historyRepo.getActiveDates(command)
  })

  wrapIpcHandler('history:get-events-by-date', async (_, date: unknown) => {
    if (typeof date !== 'string') {
      throw new TypeError('Invalid date for getting events by date')
    }

    return historyRepo.getEventsByDate(date)
  })
}
