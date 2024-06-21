import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateRssDto {
  @IsNotEmpty({
    message: '名称不能为空',
  })
  rssName: string;

  description: string;

  @IsUrl(
    {},
    {
      message: 'URL 格式不正确',
    },
  )
  url: string;

  @IsNotEmpty({
    message: '图标不能为空',
  })
  icon: string;

  @IsNotEmpty({
    message: '类型不能为空',
  })
  typeId: string;

  source: 'admin' | 'user';

  other: string;
}

export class SubscriptionDto {
  rssId: string;
  type: 'update' | 'add' | 'delete';
  group?: string;
}
export class DeleteRssSubscriptionGroupDto {
  groupId: string;
}
