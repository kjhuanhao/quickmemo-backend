import { XMLParser } from 'fast-xml-parser';
import axios, { AxiosRequestConfig } from 'axios';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const parseDate = (dateString) => {
  console.log(dateString, 'input string'); // 打印输入的日期字符串
  const formats = [
    'ddd, D MMM YYYY HH:mm:ss [GMT]', // Tue, 18 Jun 2024 05:24:16 GMT
  ];

  for (const format of formats) {
    const parsedDate = dayjs(dateString, format, true);
    console.log(`Trying format: ${format} => Valid: ${parsedDate.isValid()}`); // 打印尝试的格式和是否有效

    if (parsedDate.isValid()) {
      const timestamp = parsedDate.valueOf();
      console.log(timestamp.toString(), 'parsed timestamp'); // 打印解析后的时间戳
      return timestamp;
    }
  }

  const fallbackTimestamp = dayjs().valueOf();
  console.warn(
    'Failed to parse date, returning current timestamp:',
    fallbackTimestamp,
  ); // 打印警告信息和当前时间戳
  return fallbackTimestamp; // Fallback to current date if all parsing fails
};

const parse = async (
  url: string,
  config?: AxiosRequestConfig,
): Promise<RssInfo | null> => {
  if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(url)) return null;

  const { data } = await axios(url, config);
  const xml = new XMLParser({
    attributeNamePrefix: '',
    textNodeName: '$text',
    ignoreAttributes: false,
  });

  const result = xml.parse(data);
  let channel = result.rss?.channel ?? result.feed;
  if (Array.isArray(channel)) channel = channel[0];

  const items = Array.isArray(channel.item || channel.entry)
    ? channel.item || channel.entry
    : [channel.item || channel.entry];

  const rss: RssInfo = {
    id: channel.id ?? '',
    title: channel.title ?? '',
    link: channel.link?.href ?? channel.link,
    items: items.map((val: any) => ({
      id: val.guid?.$text ?? val.id,
      title: val.title?.$text ?? val.title,
      link: val.link?.href ?? val.link,
      created: val.updated
        ? parseDate(val.updated)
        : val.pubDate
          ? parseDate(val.pubDate)
          : val.created
            ? parseDate(val.created)
            : dayjs().valueOf(),
    })),
  };
  
  return rss;
};

declare const Parse: (
  url: string,
  config?: AxiosRequestConfig,
) => Promise<RssInfo>;

export default parse;
export { parse, Parse };
