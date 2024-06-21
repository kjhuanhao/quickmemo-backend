import { Controller, Get } from '@nestjs/common';
import type { SubmissionEntity } from 'src/entities/submission.eneity';
import { SubmissionsService } from './submission.service';
import { User } from 'src/decorators/user.decorator';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get()
  async getRecentSubmissions(
    @User() user: UserDecoded
  ): Promise<SubmissionEntity[]> {
    return this.submissionsService.findRecentSubmissions(user.id);
  }

}
