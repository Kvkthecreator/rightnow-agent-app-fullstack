import { cookies } from 'next/headers';

function key(workspaceId: string) {
  return `lastBasketId::${workspaceId}`;
}

export async function getLastBasketId(workspaceId: string): Promise<string | null> {
  return cookies().get(key(workspaceId))?.value ?? null;
}

export async function setLastBasketId(workspaceId: string, basketId: string) {
  cookies().set(key(workspaceId), basketId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
}
