import { Box, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

const GROUPS: Array<{ title: string; keys: Array<[string, string]> }> = [
  {
    title: '播控',
    keys: [
      ['Space', '播出 → 下一步 → 收起（与经典播控一致）'],
      ['Shift + Space', '播出 / 收起'],
      ['F5 或 U', '更新播出中的内容'],
      ['N', '下一步'],
      ['↑ ↓ ← →', '在包装之间移动'],
      ['[ 与 ]', '切换到上一行 / 下一行数据'],
      ['Enter', '打开属性面板'],
      ['Esc 连按两次', '全部收起'],
      ['/', '搜索包装']
    ]
  },
  {
    title: '数据表',
    keys: [
      ['方向键 / Tab / Enter', '移动单元格'],
      ['直接输入 / F2', '编辑单元格'],
      ['Ctrl/⌘ + C / V', '复制 / 粘贴（可直接从 Excel 粘贴多行）'],
      ['Ctrl/⌘ + Z / Shift+Z', '撤销 / 重做'],
      ['Delete', '清空所选单元格'],
      ['Ctrl/⌘ + Enter', '在下方插入一行']
    ]
  },
  {
    title: '通用',
    keys: [
      ['Alt + 1 / 2 / 3', '切换 播控 / 标志组 / 数据源'],
      ['Ctrl/⌘ + S', '立即保存（平时会自动保存）'],
      ['?', '显示本帮助']
    ]
  }
];

function Key({ children }: { children: string }) {
  return (
    <Box component="kbd" sx={{
      fontFamily: 'inherit', fontSize: 12, fontWeight: 500, px: 1, py: 0.25, borderRadius: 1,
      bgcolor: 'md.surfaceContainerHighest', color: 'text.primary', border: 1, borderColor: 'divider', whiteSpace: 'nowrap'
    }}>{children}</Box>
  );
}

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>键盘快捷键</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 3 }}>
          {GROUPS.map((group) => (
            <Box key={group.title}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1 }}>{group.title}</Typography>
              <Stack sx={{ gap: 1 }}>
                {group.keys.map(([key, text]) => (
                  <Stack key={key} direction="row" sx={{ gap: 2, alignItems: 'center' }}>
                    <Box sx={{ width: 170, flexShrink: 0 }}><Key>{key}</Key></Box>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>{text}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
