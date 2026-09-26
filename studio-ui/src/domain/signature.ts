import type { Binding, LogoLibrary, RundownItem, SourcesFile } from '@/api/types';
import { effectiveValues } from './binding';
import { isLogoLibrary, outputLayer } from './items';
import { resolveLogoValues } from './logos';

/** Everything that changes what the item looks like on air, as a stable string. */
export function airSignature(item: RundownItem, binding: Binding | undefined, sources: SourcesFile | undefined, library: LogoLibrary | null | undefined) {
  const values = effectiveValues(item, binding, sources);
  if (isLogoLibrary(item)) Object.assign(values, resolveLogoValues(library, sources));
  const ordered = Object.keys(values).sort().map((key) => [key, values[key]]);
  return JSON.stringify([outputLayer(item, binding), ordered]);
}
