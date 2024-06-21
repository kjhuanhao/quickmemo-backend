import { IsNotEmpty } from 'class-validator';

export class createTagsDto {
  @IsNotEmpty({
    message: '标签名字不能为空',
  })
  name: string;
}

export class updateTagsDto {
  @IsNotEmpty({
    message: 'id不能为空',
  })
  id: string;

  @IsNotEmpty({
    message: '标签名字不能为空',
  })
  name: string;
}

export class deleteTagsDto {
  @IsNotEmpty({
    message: 'id不能为空',
  })
  id: string;
}
