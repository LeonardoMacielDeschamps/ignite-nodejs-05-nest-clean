import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AnswerFactory } from 'test/factories/make-answer'
import { AnswerAttachmentFactory } from 'test/factories/make-answer-attachment'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { QuestionFactory } from 'test/factories/make-question'
import { StudentFactory } from 'test/factories/make-student'

describe('Edit answer (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let answerFactory: AnswerFactory
  let attachmentFactory: AttachmentFactory
  let answerAttachmentFactory: AnswerAttachmentFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AnswerFactory,
        AttachmentFactory,
        AnswerAttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    answerFactory = moduleRef.get(AnswerFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    answerAttachmentFactory = moduleRef.get(AnswerAttachmentFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PUT] /answers/:id', async () => {
    const [
      { id: authorId },
      firstAttachment,
      secondAttachment,
      thirdAttachment,
    ] = await Promise.all([
      studentFactory.makePrismaStudent(),
      attachmentFactory.makePrismaAttachment(),
      attachmentFactory.makePrismaAttachment(),
      attachmentFactory.makePrismaAttachment(),
    ])

    const accessToken = jwt.sign({ sub: authorId.toString() })

    const { id: questionId } = await questionFactory.makePrismaQuestion({
      authorId,
    })

    const { id: answerId } = await answerFactory.makePrismaAnswer({
      questionId,
      authorId,
    })

    await Promise.all([
      answerAttachmentFactory.makePrismaAnswerAttachment({
        attachmentId: firstAttachment.id,
        answerId,
      }),
      answerAttachmentFactory.makePrismaAnswerAttachment({
        attachmentId: secondAttachment.id,
        answerId,
      }),
    ])

    const content = 'New content'

    const response = await request(app.getHttpServer())
      .put(`/answers/${answerId.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content,
        attachments: [
          firstAttachment.id.toString(),
          thirdAttachment.id.toString(),
        ],
      })

    expect(response.statusCode).toBe(204)

    const answerOnDatabase = await prisma.answer.findFirst({
      include: {
        attachments: true,
      },
      where: {
        content,
      },
    })

    expect(answerOnDatabase).toBeTruthy()
    expect(answerOnDatabase?.attachments).toHaveLength(2)
    expect(answerOnDatabase?.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstAttachment.id.toString() }),
        expect.objectContaining({ id: thirdAttachment.id.toString() }),
      ]),
    )
  })
})
