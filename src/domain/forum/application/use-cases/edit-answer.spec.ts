import { InMemoryAnswersRepository } from 'test/repositories/in-memory-answers-repository'
import { InMemoryAnswerAttachmentsRepository } from 'test/repositories/in-memory-answer-attachments-repository'
import { EditAnswerUseCase } from './edit-answer'
import { makeAnswer } from 'test/factories/make-answer'
import { makeAnswerAttachment } from 'test/factories/make-answer-attachment'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let inMemoryAnswersRepository: InMemoryAnswersRepository
let inMemoryAnswerAttachmentsRepository: InMemoryAnswerAttachmentsRepository
let sut: EditAnswerUseCase

describe('Edit answer', () => {
  beforeEach(() => {
    inMemoryAnswerAttachmentsRepository =
      new InMemoryAnswerAttachmentsRepository()
    inMemoryAnswersRepository = new InMemoryAnswersRepository(
      inMemoryAnswerAttachmentsRepository,
    )

    sut = new EditAnswerUseCase(
      inMemoryAnswersRepository,
      inMemoryAnswerAttachmentsRepository,
    )
  })

  it('should be able to edit an answer', async () => {
    const newAnswer = makeAnswer(
      {
        authorId: new UniqueEntityId('author-1'),
      },
      new UniqueEntityId('answer-1'),
    )

    await inMemoryAnswersRepository.create(newAnswer)

    inMemoryAnswerAttachmentsRepository.items.push(
      makeAnswerAttachment({
        answerId: newAnswer.id,
        attachmentId: new UniqueEntityId('1'),
      }),
      makeAnswerAttachment({
        answerId: newAnswer.id,
        attachmentId: new UniqueEntityId('2'),
      }),
    )

    await sut.execute({
      answerId: newAnswer.id.toString(),
      authorId: 'author-1',
      content: 'Conteúdo teste',
      attachmentsIds: ['1', '3'],
    })

    expect(inMemoryAnswersRepository.items[0]).toMatchObject({
      content: 'Conteúdo teste',
    })
    expect(
      inMemoryAnswersRepository.items[0].attachments.currentItems,
    ).toHaveLength(2)
    expect(inMemoryAnswersRepository.items[0].attachments.currentItems).toEqual(
      [
        expect.objectContaining({ attachmentId: new UniqueEntityId('1') }),
        expect.objectContaining({ attachmentId: new UniqueEntityId('3') }),
      ],
    )
  })

  it('should not be able to edit an answer from another user', async () => {
    const newAnswer = makeAnswer(
      {
        authorId: new UniqueEntityId('author-1'),
      },
      new UniqueEntityId('answer-1'),
    )

    await inMemoryAnswersRepository.create(newAnswer)

    const result = await sut.execute({
      answerId: newAnswer.id.toString(),
      authorId: 'author-2',
      content: 'Conteúdo teste',
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should sync new and remove attachments when editing an answer', async () => {
    const newAnswer = makeAnswer(
      {
        authorId: new UniqueEntityId('author-1'),
      },
      new UniqueEntityId('answer-1'),
    )

    await inMemoryAnswersRepository.create(newAnswer)

    inMemoryAnswerAttachmentsRepository.items.push(
      makeAnswerAttachment({
        answerId: newAnswer.id,
        attachmentId: new UniqueEntityId('1'),
      }),
      makeAnswerAttachment({
        answerId: newAnswer.id,
        attachmentId: new UniqueEntityId('2'),
      }),
    )

    const result = await sut.execute({
      answerId: newAnswer.id.toString(),
      authorId: 'author-1',
      content: 'Conteúdo teste',
      attachmentsIds: ['1', '3'],
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryAnswerAttachmentsRepository.items).toHaveLength(2)
    expect(inMemoryAnswerAttachmentsRepository.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attachmentId: new UniqueEntityId('1'),
        }),
        expect.objectContaining({
          attachmentId: new UniqueEntityId('3'),
        }),
      ]),
    )
  })
})
