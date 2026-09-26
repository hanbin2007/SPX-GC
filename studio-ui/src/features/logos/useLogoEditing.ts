import { useMemo } from 'react';
import { formatGroups, MEMBER_FIELDS, parseGroups, SCHOOL_EMBLEM_URL, slotField } from '@/domain/logos';
import { setLogoValue } from '@/store/logoActions';
import { useLogoLibrary, useLogoValues } from '@/store/selectors';
import { useStudio } from '@/store/studio';

/** Resolved library values plus the small helpers every logo panel needs. */
export function useLogoEditing() {
  const library = useLogoLibrary();
  const values = useLogoValues();
  const assets = useStudio((store) => store.logoAssets);
  return useMemo(() => ({
    library,
    values,
    assets,
    /** Membership of member `index` is read from a datasource column. */
    isMapped: (index: number) => Boolean(library?.fieldColumns?.[MEMBER_FIELDS[index]]),
    urlOf: (index: number) => index === 0
      ? SCHOOL_EMBLEM_URL
      : assets.find((asset) => asset.value === values[slotField.file(index)])?.url ?? null,
    assetOf: (value: string) => assets.find((asset) => asset.value === value) ?? null,
    groupsOf: (index: number) => parseGroups(values[MEMBER_FIELDS[index]]),
    toggleGroup: (index: number, group: string, on: boolean) => {
      const current = parseGroups(library?.values[MEMBER_FIELDS[index]]);
      setLogoValue(MEMBER_FIELDS[index], formatGroups(on ? [...current, group] : current.filter((entry) => entry !== group)));
    }
  }), [library, values, assets]);
}

export type LogoEditing = ReturnType<typeof useLogoEditing>;
