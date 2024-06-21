import { IsNotEmpty } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('memos')
export class MemosEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  content: string;

  @Column('json')
  tags: string[];

  @Column('json')
  images: string[];

  @CreateDateColumn()
  createdTime: Date;

  @UpdateDateColumn()
  updatedTime: Date;

  @Column()
  @IsNotEmpty()
  @ManyToOne(() => UserEntity, (user) => user.id)
  createdBy: string;
}
