interface RssResult {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  type: string;
  selected: string;
}

interface ChangeRssSubscriptionGroupDto {
  rssId: string;
  groupId: string;
}

interface UpdateRssGroupDto {
  id: string;
  name: string;
}

interface RssInfo {
  id: string
  title: string;
  link: string;
  items: {
    id: string;
    title: string;
    link: string;
    created: number;
  }[];
}