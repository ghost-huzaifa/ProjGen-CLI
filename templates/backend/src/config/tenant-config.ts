import * as fs from 'fs';
import * as ini from 'ini';
import { join } from 'path';

const configFilePath = join(process.cwd(), 'env.conf');
const rawConfig = fs.readFileSync(configFilePath, 'utf-8');
const parsedConfig = ini.parse(rawConfig);

export function getTenantDbConfigByHost(host: string) {
  let host1 = host.split('.')[0];
  const tenantConfig = parsedConfig[host1];
  if (!tenantConfig) {
    console.log("parse config:...", parsedConfig);
    throw new Error(`No config found for host: ${host1}`);
  }
  return {
    url: tenantConfig.DATABASE_URL,
  };
}