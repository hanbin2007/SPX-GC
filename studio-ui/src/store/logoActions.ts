import { api } from '@/api/client';
import type { LogoEntry, LogoGroup } from '@/api/types';
import { SCHOOL_ID, updateMember } from '@/domain/logos';
import { updateLogoLibrary } from './persistence';
import { getStudio, setStudio } from './studio';
import { toast, toastError } from './toasts';

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const LOGO_ACCEPT = ACCEPTED.join(',');

export async function loadLogoAssets() {
  try {
    setStudio({ logoAssets: await api.logos() });
  } catch (error) { toastError(error); }
}

export function addGroup() {
  const library = getStudio().state?.logoLibrary;
  if (!library) return null;
  const id = String(library.groups.reduce((max, group) => {
    const value = BigInt(group.id);
    return value > max ? value : max;
  }, 0n) + 1n);
  updateLogoLibrary((draft) => ({ ...draft, groups: [...draft.groups, { id, name: `${id} 组`, mode: 'auto', interval: 8 }] }));
  return id;
}

export function updateGroup(id: string, change: Partial<LogoGroup>) {
  updateLogoLibrary((draft) => ({ ...draft,
    groups: draft.groups.map((group) => group.id === id ? { ...group, ...change } : group)
  }));
}

export function removeGroup(id: string) {
  updateLogoLibrary((draft) => {
    if (draft.groups.length <= 1) return draft;
    return {
      ...draft,
      groups: draft.groups.filter((group) => group.id !== id),
      school: { ...draft.school, groups: draft.school.groups.filter((group) => group !== id) },
      logos: draft.logos.map((logo) => ({ ...logo, groups: logo.groups.filter((group) => group !== id) }))
    };
  });
}

export function addLogo(groupId: string) {
  const id = crypto.randomUUID();
  const logo: LogoEntry = { id, src: '', label: '', style: 'auto', scale: 1, dwell: '', groups: [groupId] };
  updateLogoLibrary((draft) => ({ ...draft, logos: [...draft.logos, logo] }));
  return id;
}

export function updateLogo(id: string, change: Partial<LogoEntry>) {
  updateLogoLibrary((draft) => updateMember(draft, id, (logo) => ({ ...logo, ...change })));
}

export function removeLogo(id: string) {
  updateLogoLibrary((draft) => ({ ...draft,
    logos: draft.logos.filter((logo) => logo.id !== id),
    groupColumns: Object.fromEntries(Object.entries(draft.groupColumns).filter(([key]) => key !== id))
  }));
}

export function setMembership(id: string, groupId: string, on: boolean) {
  updateLogoLibrary((draft) => {
    const change = (groups: string[]) => on ? [...new Set([...groups, groupId])] : groups.filter((group) => group !== groupId);
    if (id === SCHOOL_ID) return { ...draft, school: { ...draft.school, groups: change(draft.school.groups) } };
    return updateMember(draft, id, (logo) => ({ ...logo, groups: change(logo.groups) }));
  });
}

export function setSchoolDwell(dwell: string) {
  updateLogoLibrary((draft) => ({ ...draft, school: { ...draft.school, dwell } }));
}

/** Upload an image and optionally assign it to a library entry. */
export async function uploadLogo(file: File, logoId?: string) {
  if (!ACCEPTED.includes(file.type) || file.size > 5_000_000) {
    toastError(new Error('请选择 5 MB 以下的 PNG、JPG、WebP 或 GIF 图片'));
    return null;
  }
  try {
    const asset = await api.uploadLogo(file);
    setStudio({ logoAssets: [...getStudio().logoAssets.filter((entry) => entry.value !== asset.value), asset]
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')) });
    if (logoId) updateLogo(logoId, { src: asset.value });
    toast(logoId ? '图片已上传并放入图片库' : '图片已上传');
    return asset;
  } catch (error) { toastError(error); return null; }
}
