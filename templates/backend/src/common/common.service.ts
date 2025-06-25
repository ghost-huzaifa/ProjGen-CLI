import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { asyncScheduler, firstValueFrom, lastValueFrom, map } from 'rxjs';
// import { PrismaService } from 'src/prisma/prisma.service';
const fs = require('fs');

@Injectable()
export class CommonService {
  // private REPORT_SERVER_URL: string;
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    // this.REPORT_SERVER_URL = this.configService.getOrThrow<string>('REPORT_SERVER_URL');
  }

  async getExternalApi<T>(url: string) {
    const data = (await firstValueFrom(this.httpService.get<T>(url))).data;
    return data;
  }

  async postExternalApi<Rq, Rs>(url: string, data: Rq) {
    const res = (await firstValueFrom(this.httpService.post<Rs>(url, data))).data;
    return res;
  }

  async postCallApi<Rq, Rs>(
    requestUrl: string,
    data: Rq,
    queryParams = {},
    headers: AxiosRequestHeaders = {} as AxiosRequestHeaders,
  ) {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      params: queryParams,
    };

    const url: string = requestUrl;

    try {
      const responseData: Rs = await lastValueFrom(
        this.httpService.post(url, data, requestConfig).pipe(
          map((response) => {
            return response.data;
          }),
        ),
      );
      return responseData;
    } catch (error) {
      console.error(error);
      console.error(error.message, error.code);
      throw new InternalServerErrorException(
        'EXTERNAL API call failed. Databases may be out of sync, or request body may be malformed. THIS ERROR SHOULD NOT BE SHOWING IN PRODUCTION',
      );
    }
  }

  // async postReportServer<Rq, Rs>(reqPath: string, data: Rq) {
  //   // console.log('REPORT REQUEST ----- ');
  //   // console.dir(data, { depth: Infinity });

  //   try {
  //     return await this.postCallApi<Rq, Rs>(this.REPORT_SERVER_URL + reqPath, data, {});
  //   } catch (error) {
  //     throw new InternalServerErrorException('Could not get data from Report server! See error logs for more info');
  //   }
  // }
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
