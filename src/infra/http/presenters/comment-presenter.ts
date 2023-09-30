import { QuestionComment } from '@/domain/forum/enterprise/entities/question-comment'
import { AnswerComment } from '@/domain/forum/enterprise/entities/answer-comment'

export class CommentPresenter {
  static toHttp(comment: QuestionComment | AnswerComment) {
    return {
      id: comment.id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }
  }
}
