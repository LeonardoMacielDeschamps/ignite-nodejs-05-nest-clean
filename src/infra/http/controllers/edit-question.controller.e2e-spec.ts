import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { QuestionFactory } from 'test/factories/make-question'
import { QuestionAttachmentFactory } from 'test/factories/make-question-attachment'
import { StudentFactory } from 'test/factories/make-student'

describe('Edit question (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let attachmentFactory: AttachmentFactory
  let questionAttachmentFactory: QuestionAttachmentFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AttachmentFactory,
        QuestionAttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    questionAttachmentFactory = moduleRef.get(QuestionAttachmentFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PUT] /questions/:id', async () => {
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

    const [title, content] = ['New title', 'New content']

    const { id: questionId } = await questionFactory.makePrismaQuestion({
      authorId,
    })

    await Promise.all([
      questionAttachmentFactory.makePrismaQuestionAttachment({
        attachmentId: firstAttachment.id,
        questionId,
      }),
      questionAttachmentFactory.makePrismaQuestionAttachment({
        attachmentId: secondAttachment.id,
        questionId,
      }),
    ])

    const response = await request(app.getHttpServer())
      .put(`/questions/${questionId.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title,
        content,
        attachments: [
          firstAttachment.id.toString(),
          thirdAttachment.id.toString(),
        ],
      })

    expect(response.statusCode).toBe(204)

    const questionOnDatabase = await prisma.question.findFirst({
      where: {
        title,
        content,
      },
      include: {
        attachments: true,
      },
    })

    expect(questionOnDatabase).toBeTruthy()
    expect(questionOnDatabase?.attachments).toHaveLength(2)
    expect(questionOnDatabase?.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstAttachment.id.toString() }),
        expect.objectContaining({ id: thirdAttachment.id.toString() }),
      ]),
    )
  })
})
