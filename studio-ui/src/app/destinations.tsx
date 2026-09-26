import CollectionsOutlined from '@mui/icons-material/CollectionsOutlined';
import CollectionsRounded from '@mui/icons-material/CollectionsRounded';
import SmartDisplayOutlined from '@mui/icons-material/SmartDisplayOutlined';
import SmartDisplayRounded from '@mui/icons-material/SmartDisplayRounded';
import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import TableChartRounded from '@mui/icons-material/TableChartRounded';
import type { ReactNode } from 'react';
import type { View } from '@/store/studio';

export interface Destination { view: View; label: string; icon: ReactNode; activeIcon: ReactNode; shortcut: string }

export const DESTINATIONS: Destination[] = [
  { view: 'playout', label: '播控', icon: <SmartDisplayOutlined />, activeIcon: <SmartDisplayRounded />, shortcut: 'Alt+1' },
  { view: 'logos', label: '标志组', icon: <CollectionsOutlined />, activeIcon: <CollectionsRounded />, shortcut: 'Alt+2' },
  { view: 'sources', label: '数据源', icon: <TableChartOutlined />, activeIcon: <TableChartRounded />, shortcut: 'Alt+3' }
];
