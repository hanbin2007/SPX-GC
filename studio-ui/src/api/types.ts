/** Shapes returned by /api/studio (see utils/studio_store.js). */

export type FieldType =
  | 'textfield' | 'textarea' | 'dropdown' | 'checkbox' | 'number' | 'filelist'
  | 'instruction' | 'divider' | 'hidden' | 'button' | 'caption' | 'color' | string;

export interface DropdownOption { text: string; value: string }

export interface DataField {
  field?: string;
  ftype?: FieldType;
  title?: string;
  value?: string | number;
  items?: DropdownOption[];
  assetfolder?: string;
  extension?: string;
}

export interface RundownItem {
  itemID: string;
  description?: string;
  relpath?: string;
  webplayout?: string;
  playserver?: string;
  playchannel?: string;
  playlayer?: string;
  out?: string;
  steps?: string;
  uicolor?: string;
  onair?: 'true' | 'false';
  DataFields?: DataField[];
}

export type BindingMode = 'row' | 'range';

export interface Binding {
  sourceId: string;
  mode: BindingMode;
  rowIndex: number;
  rangeStart: number;
  rangeEnd: number;
  rangeField: string;
  rangeTextColumn: string;
  rangeTimeColumn: string;
  fieldColumns: Record<string, string>;
  manualValues: Record<string, string>;
  outputLayer: string;
  out: string;
}

export interface BindingsFile { version: number; revision: number; items: Record<string, Binding> }

export interface SourceColumn { key: string; title: string }
export type SourceRow = { _id: string } & Record<string, string>;

export interface Source {
  id: string;
  name: string;
  columns: SourceColumn[];
  rows: SourceRow[];
  archived?: boolean;
}

export interface SourcesFile { version: number; revision: number; sources: Source[] }

export interface LogoLibrary {
  version: number;
  revision: number;
  values: Record<string, string>;
  fieldColumns: Record<string, string>;
  sourceId: string;
  rowIndex: number;
}

export interface StudioState {
  project: string;
  rundown: string;
  items: RundownItem[];
  sources: SourcesFile;
  bindings: BindingsFile;
  logoLibrary: LogoLibrary | null;
}

export interface LogoAsset { name: string; value: string; url: string }

export type PlayoutCommand = 'play' | 'stop' | 'update' | 'next';
