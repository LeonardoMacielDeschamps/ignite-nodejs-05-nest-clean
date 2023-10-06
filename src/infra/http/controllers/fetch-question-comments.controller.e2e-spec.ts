import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { QuestionFactory } from 'test/factories/make-question'
import { QuestionCommentFactory } from 'test/factories/make-question-comment'
import { StudentFactory } from 'test/factories/make-student'

describe('Fetch question comments (e2e)', () => {
  let app: INestApplication
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let questionCommentFactory: QuestionCommentFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory, QuestionCommentFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    questionCommentFactory = moduleRef.get(QuestionCommentFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /questions/:questionId/comments', async () => {
    const { id: authorId, name: authorName } =
      await studentFactory.makePrismaStudent()

    const accessToken = jwt.sign({ sub: authorId.toString() })

    const { id: questionId } = await questionFactory.makePrismaQuestion({
      authorId,
    })

    const [firstQuestionComment, secondQuestionComment] = await Promise.all([
      questionCommentFactory.makePrismaQuestionComment({
        questionId,
        authorId,
      }),
      questionCommentFactory.makePrismaQuestionComment({
        questionId,
        authorId,
      }),
    ])

    const response = await request(app.getHttpServer())
      .get(`/questions/${questionId.toString()}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      comments: expect.arrayContaining([
        expect.objectContaining({
          content: firstQuestionComment.content,
          authorName,
        }),
        expect.objectContaining({
          content: secondQuestionComment.content,
          authorName,
        }),
      ]),
    })
  })
})
