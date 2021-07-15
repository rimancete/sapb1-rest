import { Injectable } from '@nestjs/common';
import { Config } from './interfaces';
import { config } from 'dotenv';

config();

@Injectable()
export class ConfigService {
  private readonly envConfig: Config;

  constructor() {
    const config: Config = {
      SERVICE_LAYER_URL: process.env.SERVICE_LAYER_URL,
      SERVICE_LAYER_USERNAME: process.env.SERVICE_LAYER_USERNAME,
      SERVICE_LAYER_PASSWORD: process.env.SERVICE_LAYER_PASSWORD,
      DATABASE_HOST: process.env.DATABASE_HOST,
      DATABASE_PORT: process.env.DATABASE_PORT,
      DATABASE_NAME: process.env.DATABASE_NAME,
      DATABASE_USER: process.env.DATABASE_USER,
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
      GATEC_URL: process.env.GATEC_URL,
      GATEC_TOKEN: process.env.GATEC_TOKEN,
    };
    this.envConfig = config;
  }

  get(): Config {
    return this.envConfig;
  }
}
