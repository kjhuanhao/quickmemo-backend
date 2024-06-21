import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity'

@Entity('submissions')
export class SubmissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @ManyToOne(() => UserEntity, (user) => user.id)
  createdBy: string;

  @Column()
  submissionDate: Date;

  @Column()
  status: number;
}
