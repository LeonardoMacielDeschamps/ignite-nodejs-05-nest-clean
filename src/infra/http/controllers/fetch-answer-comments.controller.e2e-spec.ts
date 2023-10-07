import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { QuestionFactory } from 'test/factories/make-question'
import { AnswerCommentFactory } from 'test/factories/make-answer-comment'
import { StudentFactory } from 'test/factories/make-student'
import { AnswerFactory } from 'test/factories/make-answer'

describe('Fetch answer comments (e2e)', () => {
  let app: INestApplication
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let answerFactory: AnswerFactory
  let answerCommentFactory: AnswerCommentFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AnswerFactory,
        AnswerCommentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    answerFactory = moduleRef.get(AnswerFactory)
    answerCommentFactory = moduleRef.get(AnswerCommentFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /answers/:answerId/comments', async () => {
    const { id: authorId, name: authorName } =
      await studentFactory.makePrismaStudent()

    const accessToken = jwt.sign({ sub: authorId.toString() })

    const { id: questionId } = await questionFactory.makePrismaQuestion({
      authorId,
    })

    const { id: answerId } = await answerFactory.makePrismaAnswer({
      questionId,
      authorId,
    })

    const [firstAnswerComment, secondAnswerComment] = await Promise.all([
      answerCommentFactory.makePrismaAnswerComment({
        answerId,
        authorId,
      }),
      answerCommentFactory.makePrismaAnswerComment({
        answerId,
        authorId,
      }),
    ])

    const response = await request(app.getHttpServer())
      .get(`/answers/${answerId.toString()}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      comments: expect.arrayContaining([
        expect.objectContaining({
          content: firstAnswerComment.content,
          authorName,
        }),
        expect.objectContaining({
          content: secondAnswerComment.content,
          authorName,
        }),
      ]),
    })
  })
})
