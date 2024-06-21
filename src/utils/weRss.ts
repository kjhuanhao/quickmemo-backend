import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as https from 'https';

interface WeRssInfo {
  id: string;
  name: string;
  cover: string;
  intro: string;
  updateTime: number;
}
type WeRssInfoResponse = {
  id: string;
  mpId: string;
  title: string;
  picUrl: string;
  publishTime: number;
  createdAt: string;
  updatedAt: string;
};
export class WeRssUtils {
  private weRssUrl: string = '';
  private atomUrl: string = '';
  private httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
  private headers = {};

  constructor() {
    const configService = new ConfigService();
    const weRssUrl = configService.get('WE_RSS_URL');
    const atomUrl = configService.get('WE_RSS_ATOM_URL');
    this.weRssUrl = weRssUrl;
    this.atomUrl = atomUrl;
    this.headers = {
      Accept: '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      Authorization: 'LnwUvN4gGQLlo6ApvX5S',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      Cookie: 'psession=47ab516e-38f9-453e-b758-fc7652a3a76b',
      DNT: '1',
      Origin: weRssUrl,
      Pragma: 'no-cache',
      Referer: `${weRssUrl}/dash/feeds`,
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'content-type': 'application/json',
    };
  }

  async fetchMpInfo(url: string): Promise<WeRssInfo> {
    console.log(this.weRssUrl, 'url');
    console.log(this.headers, 'headers');

    try {
      const response = await axios.post(
        `${this.weRssUrl}/trpc/platform.getMpInfo?batch=1`,
        {
          '0': {
            wxsLink: url,
          },
        },
        {
          headers: this.headers,
          httpsAgent: this.httpsAgent,
        },
      );

      if (response.data) {
        console.log(response.data[0].result.data[0], '12345');

        return response.data[0].result.data[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching MP info:', error);
      return null;
    }
  }

  private async addFeed(weRssInfo: WeRssInfo) {
    try {
      const reqData = {
        id: weRssInfo.id,
        mpName: weRssInfo.name,
        mpCover: weRssInfo.cover,
        mpIntro: weRssInfo.intro,
        updateTime: weRssInfo.updateTime,
        status: 1,
      };
      console.log(JSON.stringify(reqData), 'json');
      const response = await axios.post(
        `${this.weRssUrl}/trpc/feed.add?batch=1`,
        {
          '0': reqData,
        },
        {
          headers: this.headers,
          httpsAgent: this.httpsAgent,
        },
      );

      const data = response.data;
      console.log(JSON.stringify(data));
    } catch (error) {
      console.error('Error adding feed:', error);
    }
  }

  private async refreshFeeds(mpId: string) {
    try {
      await axios.post(
        `${this.weRssUrl}/trpc/feed.refreshArticles?batch=1`,
        { '0': { mpId } },
        {
          headers: this.headers,
          httpsAgent: this.httpsAgent,
        },
      );
      console.log('success');
    } catch (error) {
      console.log(error);
    }
  }

  async getWeRssInfoByMpId(
    mpId: string,
    limit: number = 100,
  ): Promise<RssInfo> {
    const url = `${this.weRssUrl}/trpc/article.list`;
    const params = {
      batch: 1,
      input: `{"0":{"limit":${limit},"mpId":"${mpId}"}}`,
    };
    try {
      const response = await axios.get(url, {
        params,
        headers: this.headers,
        httpsAgent: this.httpsAgent,
      });
      const data: WeRssInfoResponse[] = response.data[0].result.data.items;
      const items = data.map((item) => {
        return {
          id: item.id,
          title: item.title,
          created: item.publishTime * 1000,
          link: `https://mp.weixin.qq.com/s/${item.id}`,
        };
      });

      // 按 created 时间戳排序
      items.sort((a, b) => b.created - a.created);

      return {
        id: mpId,
        title: null,
        link: null,
        items,
      };
    } catch (error) {
      console.log(error);
      throw error; // 确保调用者知道发生了错误
    }
  }

  async getAllWeRssInfo(): Promise<Record<string, RssInfo>> {
    const weRssListUrl = `${this.weRssUrl}/trpc/feed.list`;
    const weRssListParams = {
      batch: 1,
      input: '{"0":{}}',
    };
    try {
      // 获取所有的 id
      const response = await axios.get(weRssListUrl, {
        params: weRssListParams,
        headers: this.headers,
        httpsAgent: this.httpsAgent,
      });

      const weRssIdList: string[] = response.data[0].result.data.items.map(
        (item: any) => {
          return item.id;
        },
      );

      const rssInfoMap: Record<string, RssInfo> = {};
      for (const id of weRssIdList) {
        // 获取最新的10个
        const weRssInfo = await this.getWeRssInfoByMpId(id);
        weRssInfo.items = weRssInfo.items.slice(0, 10);
        rssInfoMap[id] = weRssInfo;
      }
      return rssInfoMap;
    } catch (error) {
      throw new Error('同步 weRss 失败');
    }
  }

  /**
   * 添加微信订阅源
   * @param url
   * @returns
   */
  async fetchFeed(data: WeRssInfo) {
    try {
      // const data = await this.fetchMpInfo(url);
      await this.addFeed(data);
      await this.refreshFeeds(data.id);
      return `${this.atomUrl}/feeds/${data.id}.atom`;
    } catch (error) {
      throw new Error('公众号源添加失败');
    }
  }

  async getRssUrl(id: string) {
    return `${this.atomUrl}/feeds/${id}.atom`;
  }
}
