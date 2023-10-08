import { QuestionsRepository } from '@/domain/forum/application/repositories/questions-repository'
import { AppModule } from '@/infra/app.module'
import { CacheRepository } from '@/infra/cache/cache-repository'
import { CacheModule } from '@/infra/cache/cache.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { QuestionFactory } from 'test/factories/make-question'
import { QuestionAttachmentFactory } from 'test/factories/make-question-attachment'
import { StudentFactory } from 'test/factories/make-student'

describe('Prisma Questions Repository (e2e)', () => {
  let app: INestApplication
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let attachmentFactory: AttachmentFactory
  let questionAttachmentFactory: QuestionAttachmentFactory
  let cacheRepository: CacheRepository
  let questionsRepository: QuestionsRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, CacheModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AttachmentFactory,
        QuestionAttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    questionAttachmentFactory = moduleRef.get(QuestionAttachmentFactory)
    cacheRepository = moduleRef.get(CacheRepository)
    questionsRepository = moduleRef.get(QuestionsRepository)

    await app.init()
  })

  it('should cache question details', async () => {
    const author = await studentFactory.makePrismaStudent()

    const [question, attachment] = await Promise.all([
      questionFactory.makePrismaQuestion({
        authorId: author.id,
      }),
      attachmentFactory.makePrismaAttachment(),
    ])

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      attachmentId: attachment.id,
      questionId: question.id,
    })

    const slug = question.slug.value

    const questionDetails = await questionsRepository.findDetailsBySlug(slug)

    const cachedQuestionDetails = await cacheRepository.get(
      `question:${slug}:details`,
    )

    expect(cachedQuestionDetails).toEqual(JSON.stringify(questionDetails))
  })

  it('should return cached question details on subsequent calls', async () => {
    const author = await studentFactory.makePrismaStudent()

    const [question, attachment] = await Promise.all([
      questionFactory.makePrismaQuestion({
        authorId: author.id,
      }),
      attachmentFactory.makePrismaAttachment(),
    ])

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      attachmentId: attachment.id,
      questionId: question.id,
    })

    const slug = question.slug.value

    const cachedKey = `question:${slug}:details`
    const cachedValue = { empty: true }

    await cacheRepository.set(cachedKey, JSON.stringify(cachedValue))

    const questionDetails = await questionsRepository.findDetailsBySlug(slug)

    expect(questionDetails).toEqual(cachedValue)
  })

  it('should reset question details cache when saving the question', async () => {
    const author = await studentFactory.makePrismaStudent()

    const [question, attachment] = await Promise.all([
      questionFactory.makePrismaQuestion({
        authorId: author.id,
      }),
      attachmentFactory.makePrismaAttachment(),
    ])

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      attachmentId: attachment.id,
      questionId: question.id,
    })

    const slug = question.slug.value

    const cachedKey = `question:${slug}:details`

    await cacheRepository.set(cachedKey, JSON.stringify({ empty: true }))

    await questionsRepository.save(question)

    const cachedQuestionDetails = await cacheRepository.get(cachedKey)

    expect(cachedQuestionDetails).toBeNull()
  })
})
