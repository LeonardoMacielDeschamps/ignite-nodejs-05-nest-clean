import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { NotificationFactory } from 'test/factories/make-notification'
import { StudentFactory } from 'test/factories/make-student'

describe('Read notification (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let studentFactory: StudentFactory
  let notificationFactory: NotificationFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, NotificationFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    studentFactory = moduleRef.get(StudentFactory)
    prisma = moduleRef.get(PrismaService)
    notificationFactory = moduleRef.get(NotificationFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[PATCH] /notifications/:notificationId/read', async () => {
    const { id: authorId } = await studentFactory.makePrismaStudent()

    const accessToken = jwt.sign({ sub: authorId.toString() })

    const { id: notificationId } =
      await notificationFactory.makePrismaNotification({
        recipientId: authorId,
      })

    const response = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId.toString()}/read`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(204)

    const notificationOnDatabase = await prisma.notification.findUnique({
      where: {
        id: notificationId.toString(),
      },
    })

    expect(notificationOnDatabase?.readAt).not.toBeNull()
  })
})
