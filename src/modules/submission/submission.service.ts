import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as dayjs from 'dayjs';
import { SubmissionEntity } from '../../entities/submission.eneity'

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectRepository(SubmissionEntity)
    private submissionsRepository: Repository<SubmissionEntity>,
  ) {}

  async findRecentSubmissions(userId: string): Promise<SubmissionEntity[]> {
    const today = dayjs().startOf('day').toDate();
    const startDate = dayjs().subtract(100, 'day').startOf('day').toDate();

    return this.submissionsRepository.find({
      where: {
        createdBy: userId,
        submissionDate: Between(startDate, today),
      },
      order: {
        submissionDate: 'ASC',
      },
    });
  }

  async upsertSubmission(userId: string): Promise<SubmissionEntity> {
    const today = dayjs().startOf('day').toDate();
    let submission = await this.submissionsRepository.findOne({
      where: {
        createdBy: userId,
        submissionDate: today,
      },
    });

    if (submission) {
      submission.status += 1;
    } else {
      submission = new SubmissionEntity();
      submission.createdBy = userId;
      submission.submissionDate = today;
      submission.status = 1; // 初始状态为1
    }

    return this.submissionsRepository.save(submission);
  }
}
