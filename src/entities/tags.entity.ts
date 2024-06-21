import { IsNotEmpty } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity'

@Entity('tags')
@Unique(['name'])
export class TagsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column()
  @IsNotEmpty()
  count: number;

  @Column()
  @ManyToOne(() => UserEntity, (user) => user.id)
  createdBy: string
}

