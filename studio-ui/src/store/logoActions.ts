import { api } from '@/api/client';
import { slotField } from '@/domain/logos';
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

export function setLogoValue(field: string, value: string) {
  updateLogoLibrary((library) => ({ ...library, values: { ...library.values, [field]: value } }));
}

/** Upload an image and, when a slot is given, put it in that slot. */
export async function uploadLogo(file: File, slot?: number) {
  if (!ACCEPTED.includes(file.type) || file.size > 5_000_000) {
    toastError(new Error('请选择 5 MB 以下的 PNG、JPG、WebP 或 GIF 图片'));
    return null;
  }
  try {
    const asset = await api.uploadLogo(file);
    setStudio({ logoAssets: [...getStudio().logoAssets.filter((entry) => entry.value !== asset.value), asset]
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')) });
    if (slot) setLogoValue(slotField.file(slot), asset.value);
    toast(slot ? `已上传并放入图片 ${slot}` : '图片已上传');
    return asset;
  } catch (error) { toastError(error); return null; }
}
