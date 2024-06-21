import { IsNotEmpty } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
@Entity('rss_type')
@Unique(['name'])
@Index(['id'])
export class RssTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @OneToMany(() => RssEntity, (rss) => rss.type)
  rss: RssEntity[];
}

@Entity('rss')
@Index(['id'])
export class RssEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column()
  description: string;

  @Column()
  @IsNotEmpty()
  url: string;

  @Column()
  @IsNotEmpty()
  icon: string;

  @ManyToOne(() => RssTypeEntity, (type) => type.rss, { eager: true }) // 设置 eager 以便自动加载关联对象
  @JoinColumn({ name: 'typeId' })
  type: RssTypeEntity;

  @IsNotEmpty()
  @Column()
  source: 'admin' | 'user';

  @CreateDateColumn()
  @IsNotEmpty()
  createdTime: Date;

  @UpdateDateColumn()
  updatedTime: Date;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @IsNotEmpty()
  createdBy: string;

  // @Column()
  // other: string
}

@Entity('rss_subscription')
@Index(['rss'])
export class RssSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RssEntity, { eager: true })
  @JoinColumn({ name: 'rssId' })
  rss: RssEntity;

  @ManyToOne(() => RssGroupEntity, (group) => group.id, {
    eager: true,
  })
  @JoinColumn({ name: 'groupId' })
  group: string; 

  @ManyToOne(() => UserEntity, (user) => user.id)
  @Column({nullable: false})
  createdBy: string;

  @CreateDateColumn()
  createdTime: Date;

  @UpdateDateColumn()
  updatedTime: Date;
}

@Entity('rss_group')
export class RssGroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  @ManyToOne(() => UserEntity, (user) => user.id)
  @IsNotEmpty()
  createdBy: string;
}

@Entity('rss_info')
@Index(['rss'])
export class RssInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @ManyToOne(() => RssEntity, (rss) => rss.id, { eager: true })
  @JoinColumn({ name: 'rssId' })
  rss: RssEntity; // 修改为 RssEntity 类型

  @Column()
  url: string;

  @Column({ nullable: false })
  createdTime: Date;

  @UpdateDateColumn()
  syncTime: Date;
}