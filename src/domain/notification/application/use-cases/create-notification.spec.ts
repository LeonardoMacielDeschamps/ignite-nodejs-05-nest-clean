import { InMemoryNotificationsRepository } from 'test/repositories/in-memory-notifications-repository'
import { CreateNotificationUseCase } from './create-notification'

let inMemoryNotificationsRepository: InMemoryNotificationsRepository
let sut: CreateNotificationUseCase

describe('Create Notification', () => {
  beforeEach(() => {
    inMemoryNotificationsRepository = new InMemoryNotificationsRepository()
    sut = new CreateNotificationUseCase(inMemoryNotificationsRepository)
  })

  it('should be able to create a notification', async () => {
    const result = await sut.execute({
      recipientId: '1',
      title: 'Nova notificação',
      content: 'Nova notificação',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryNotificationsRepository.items[0]).toEqual(
      result.value?.notification,
    )
  })
})
