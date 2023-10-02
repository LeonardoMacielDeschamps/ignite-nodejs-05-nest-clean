import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { StudentFactory } from 'test/factories/make-student'

describe('Create question (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let studentFactory: StudentFactory
  let attachmentFactory: AttachmentFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, AttachmentFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    studentFactory = moduleRef.get(StudentFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[POST] /questions', async () => {
    const [user, firstAttachment, secondAttachment] = await Promise.all([
      studentFactory.makePrismaStudent(),
      attachmentFactory.makePrismaAttachment(),
      attachmentFactory.makePrismaAttachment(),
    ])

    const accessToken = jwt.sign({ sub: user.id.toString() })

    const title = 'New question'
    const content = 'Question content'

    const response = await request(app.getHttpServer())
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title,
        content,
        attachments: [
          firstAttachment.id.toString(),
          secondAttachment.id.toString(),
        ],
      })

    expect(response.statusCode).toBe(201)

    const questionOnDatabase = await prisma.question.findFirst({
      include: {
        attachments: {
          select: {
            id: true,
          },
        },
      },
      where: {
        title,
      },
    })

    expect(questionOnDatabase).toBeTruthy()
    expect(questionOnDatabase?.attachments).toHaveLength(2)
    expect(questionOnDatabase?.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: firstAttachment.id.toString() }),
        expect.objectContaining({ id: secondAttachment.id.toString() }),
      ]),
    )
  })
})
