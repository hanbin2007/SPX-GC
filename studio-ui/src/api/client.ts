import type {
  Binding, BindingsFile, LogoAsset, LogoLibrary, PlayoutCommand, Source, SourcesFile, StudioState
} from './types';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const root = document.getElementById('studio-root');
export const project = root?.dataset.project ?? '';
export const rundown = root?.dataset.rundown ?? '';
const endpoint = `/api/studio/${encodeURIComponent(project)}/${encodeURIComponent(rundown)}`;

/** Server error strings are English; show operators something they can act on. */
const messages: Array<[RegExp, string]> = [
  [/changed elsewhere/i, '数据已在其他地方修改，已重新载入最新版本'],
  [/has no rows/i, '数据源没有可播出的行'],
  [/range has no content/i, '所选范围没有内容'],
  [/unavailable/i, '引用的数据源或列已不存在'],
  [/5000 rows/i, '数据源最多 5000 行'],
  [/1-30 columns/i, '数据源需要 1–30 列'],
  [/exceeds 2 MB/i, '数据源超过 2 MB'],
  [/name must be/i, '名称需为 1–100 个字符'],
  [/Invalid or duplicate column/i, '列名不能为空或重复'],
  [/Only PNG/i, '只支持 5 MB 以内的 PNG、JPG、WebP、GIF 图片']
];

function friendly(message: string) {
  return messages.find(([pattern]) => pattern.test(message))?.[1] ?? message;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint + path, { credentials: 'same-origin', ...init });
  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('studio:unauthorized'));
      throw new ApiError('登录已过期，请重新登录', 401);
    }
    const body = await response.json().catch(() => ({}));
    throw new ApiError(friendly(body.error || `请求失败 (${response.status})`), response.status);
  }
  const type = response.headers.get('content-type') || '';
  return (type.includes('application/json') ? response.json() : null) as Promise<T>;
}

function json<T>(path: string, method: string, body: unknown) {
  return request<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export const api = {
  state: () => request<StudioState>(''),
  logos: () => request<{ logos: LogoAsset[] }>('/logos').then((result) => result.logos),
  uploadLogo: (file: File) => request<LogoAsset>(`/logos?name=${encodeURIComponent(file.name)}`, {
    method: 'POST', headers: { 'Content-Type': file.type }, body: file
  }),
  saveBinding: (itemId: string, binding: Binding, revision: number) =>
    json<BindingsFile>(`/items/${encodeURIComponent(itemId)}`, 'PUT', { binding, revision }),
  saveLogoLibrary: (library: LogoLibrary, revision: number) =>
    json<LogoLibrary>('/logo-library', 'PUT', { library, revision }),
  createSource: (source: Omit<Source, 'id'>, revision: number) =>
    json<SourcesFile>('/sources', 'POST', { source, revision }),
  saveSource: (source: Source, revision: number) =>
    json<SourcesFile>(`/sources/${encodeURIComponent(source.id)}`, 'PUT', { source, revision }),
  archiveSource: (sourceId: string, archived: boolean, revision: number) =>
    json<SourcesFile>(`/sources/${encodeURIComponent(sourceId)}/archive`, 'POST', { archived, revision }),
  action: (itemId: string, action: PlayoutCommand) =>
    json<unknown>(`/items/${encodeURIComponent(itemId)}/action`, 'POST', { action })
};

export async function fetchSession(): Promise<string | null> {
  try {
    const response = await fetch('/auth/me', { credentials: 'same-origin' });
    if (!response.ok) return null;
    const session = await response.json();
    return typeof session.user === 'string' ? session.user : null;
  } catch {
    return null;
  }
}
