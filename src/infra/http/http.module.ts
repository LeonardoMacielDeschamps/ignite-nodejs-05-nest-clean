import { Module } from '@nestjs/common'

import { DatabaseModule } from '../database/database.module'
import { CryptographyModule } from '../cryptography/cryptography.module'

import { CreateAccountController } from './controllers/create-account.controller'
import { AuthenticateController } from './controllers/authenticate.controller'
import { FetchRecentQuestionsController } from './controllers/fetch-recent-questions.controller'
import { GetQuestionBySlugController } from './controllers/get-question-by-slug.controller'
import { CreateQuestionController } from './controllers/create-question.controller'
import { EditQuestionController } from './controllers/edit-question.controller'
import { DeleteQuestionController } from './controllers/delete-question.controller'
import { AnswerQuestionController } from './controllers/answer-question.controller'
import { EditAnswerController } from './controllers/edit-answer.controller'
import { DeleteAnswerController } from './controllers/delete-answer.controller'

import { RegisterStudentUseCase } from '@/domain/forum/application/use-cases/register-student'
import { AuthenticateStudentUseCase } from '@/domain/forum/application/use-cases/authenticate-student'
import { FetchRecentQuestionsUseCase } from '@/domain/forum/application/use-cases/fetch-recent-questions'
import { GetQuestionBySlugUseCase } from '@/domain/forum/application/use-cases/get-question-by-slug'
import { CreateQuestionUseCase } from '@/domain/forum/application/use-cases/create-question'
import { EditQuestionUseCase } from '@/domain/forum/application/use-cases/edit-question'
import { DeleteQuestionUseCase } from '@/domain/forum/application/use-cases/delete-question'
import { AnswerQuestionUseCase } from '@/domain/forum/application/use-cases/answer-question'
import { EditAnswerUseCase } from '@/domain/forum/application/use-cases/edit-answer'
import { DeleteAnswerUseCase } from '@/domain/forum/application/use-cases/delete-answer'

@Module({
  imports: [DatabaseModule, CryptographyModule],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    FetchRecentQuestionsController,
    GetQuestionBySlugController,
    CreateQuestionController,
    EditQuestionController,
    DeleteQuestionController,
    AnswerQuestionController,
    EditAnswerController,
    DeleteAnswerController,
  ],
  providers: [
    RegisterStudentUseCase,
    AuthenticateStudentUseCase,
    FetchRecentQuestionsUseCase,
    GetQuestionBySlugUseCase,
    CreateQuestionUseCase,
    EditQuestionUseCase,
    DeleteQuestionUseCase,
    AnswerQuestionUseCase,
    EditAnswerUseCase,
    DeleteAnswerUseCase,
  ],
})
export class HttpModule {}
