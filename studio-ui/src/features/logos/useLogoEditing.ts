import { useMemo } from 'react';
import { groupMembers, logoTitle, logoUrl, memberGroups } from '@/domain/logos';
import { setMembership } from '@/store/logoActions';
import { useLogoLibrary, useResolvedLogoLibrary } from '@/store/selectors';
import { useStudio } from '@/store/studio';

/** Project library and the datasource-resolved membership shown on air. */
export function useLogoEditing() {
  const library = useLogoLibrary();
  const resolved = useResolvedLogoLibrary();
  const assets = useStudio((store) => store.logoAssets);
  return useMemo(() => ({
    library,
    resolved,
    assets,
    isMapped: (id: string) => Boolean(library?.groupColumns[id]),
    urlOf: (id: string) => resolved ? logoUrl(resolved, id, assets) : null,
    assetOf: (value: string) => assets.find((asset) => asset.value === value) ?? null,
    titleOf: (id: string) => resolved ? logoTitle(resolved, id) : '',
    groupsOf: (id: string) => resolved ? memberGroups(resolved, id) : [],
    membersOf: (groupId: string) => resolved ? groupMembers(resolved, groupId) : [],
    toggleGroup: setMembership
  }), [library, resolved, assets]);
}

export type LogoEditing = ReturnType<typeof useLogoEditing>;
