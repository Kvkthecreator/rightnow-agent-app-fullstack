import fs from 'fs';
import path from 'path';

export async function getTestJwt(): Promise<string> {
  const statePath = path.resolve(__dirname, '..', '..', 'storageState.json');
  const raw = await fs.promises.readFile(statePath, 'utf-8');
  const state = JSON.parse(raw);
  const cookie = state.cookies.find((c: any) => c.name.endsWith('auth-token'));
  if (!cookie) throw new Error('auth cookie missing');
  const value = decodeURIComponent(cookie.value);
  const [access] = JSON.parse(value);
  return access;
}
