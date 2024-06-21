import { IsNotEmpty } from 'class-validator';

export class createMemosDto {
  @IsNotEmpty({message: '内容不能为空'})
  content: string;

  tags: string[];

  images: string[];
}

export class updateMemosDto {
  id: string;

  @IsNotEmpty({message: '内容不能为空'})
  content: string;

  tags: string[];

  images: string[];

}