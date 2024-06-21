import { Injectable } from '@nestjs/common';
import { InjectMinio } from 'nestjs-minio';
import * as minio from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService {
  private static readonly bucketName = 'quickmemo';
  private static readonly tempBucketName = 'temp';
  constructor(@InjectMinio() private readonly minioClient: minio.Client) {}

  /**
   * 文件上传到临时存储桶
   * @param files
   * @returns
   */
  async uploadFilesToTemp(files: UploadFile[]): Promise<string[]> {
    const upload = async (file: UploadFile) => {
      await this.minioClient.putObject(
        MinioService.tempBucketName,
        file.originalname,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );
      return this.getFileUrl(MinioService.tempBucketName, file.originalname)
    };
    const res = await Promise.all(files.map(upload));
    return res;
  }

  /**
   * 批量将文件从临时存储桶移动到永久存储桶
   * @param urls
   * @returns
   */
  async confirmFilesUpload(urls: string[]): Promise<string[]> {
    console.log(urls, 'urls');
    
    const objectNames = urls.map((url) => url.split('/')[4]);
    const moveFile = async (objectName: string) => {
      const conditions = new minio.CopyConditions();
      // 复制文件到永久存储桶
      await this.minioClient.copyObject(
        MinioService.bucketName,
        objectName,
        `/${MinioService.tempBucketName}/${objectName}`,
        conditions,
      );
      // 从临时存储桶中删除文件
      await this.minioClient.removeObject(
        MinioService.tempBucketName,
        objectName,
      );
      return this.getFileUrl(MinioService.bucketName, objectName)
    };
    const res = await Promise.all(objectNames.map(moveFile));
    return res;
  }

  /**
   * 获取文件 url
   * @param bucketName
   * @param objectName
   * @returns
   */
  private getFileUrl = (bucketName: string, objectName: string) => {
    const configService = new ConfigService();
    const url = configService.get('MINIO_URL', '');
    return `${url}/${bucketName}/${objectName}`;
  };

  /**
   * 获取文件
   * @param objectName
   * @param fromTemp 是否从临时存储桶获取
   * @returns
   */
  async getFile(objectName: string, fromTemp: boolean = false) {
    const bucketName = fromTemp
      ? MinioService.tempBucketName
      : MinioService.bucketName;
    const [url, stat] = await Promise.all([
      this.minioClient.presignedGetObject(bucketName, objectName, 24 * 60 * 60),
      this.minioClient.statObject(bucketName, objectName),
    ]);
    return { url, stat };
  }
}
