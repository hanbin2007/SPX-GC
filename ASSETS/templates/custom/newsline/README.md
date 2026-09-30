# NEWSLINE 新闻现场 · SPX 新闻包装

一套给 SPX Graphics Controller 用的现代新闻台图文包装：五个模板共用一个 **Scene**，按 SPX 文档
[Scene and Transition Logic](https://docs.spxgraphics.com/Documentation/Graphic+Templates/Advanced/Scene+and+Transition+Logic)
的思路实现 transition logic。格式是经典的 SPX HTML 模板，在 SPX Solo（开源版，5 个图层）上就能跑。

预览台：`http://localhost:5656/templates/custom/newsline/_demo.html`（右上角“自动演示”会按顺序演示下面每一条规则）。

## 图层规划

SPX Solo 的 web 渲染器只有 1–5 层（`views/view-renderer.handlebars` 里是 `Math.min(layer, 5)`），所以按层级从下往上排：

| 图层 | 模板 | 内容 | Scene 角色 |
|---|---|---|---|
| 5 | `BUG.html` | 台标、时钟、左上直播角标 | 常驻；全屏上屏时左上角标收起 |
| 4 | `NAME.html` | 人名条 | `lower` 槽位 |
| 3 | `HEADLINE.html` | 标题条 | `lower` 槽位 |
| 2 | `TICKER.html` | 滚动 / 翻页字幕 | 占用底部 98px |
| 1 | `FULLSCREEN.html` | 全屏图文，Continue 逐条揭示 | 上屏时让 `lower` 挂起 |

CasparCG 的 `playlayer` 默认是 11–15，`playserver` 默认 `-`。用 CasparCG 时，到 Project Settings 里改成 `OVERLAY` 即可。

## Transition Logic

每个模板都是一个 **Scene Item Controller**。它把自己的状态广播给同一个渲染器里的其他图层（兄弟 iframe），同时从听到的状态推导出同一个 Scene 环境，再执行 `_scene/scene.js` 里的 **Scene Actions**。Program、Preview 和 OBS 里各自的渲染器互不干扰。

### Single-item（同一图层）

1. **原地切换**：播出中按 Update，文字向上推走、新文字升起，底板宽度随内容形变，信号线上掠过一道光。不会先下屏再上屏。
2. **同层接力**：同一图层接着播同一个模板的下一条（比如连续几个人名），SPX 会重新加载图层 iframe。新页面会在第一帧就接回上一条的画面，然后原地切换，不会重新入场。
3. **分步**：FULLSCREEN 的 `steps` 为 5。Play 显示标题和第 1 条要点，每按一次 Continue 揭示下一条，已播要点会变暗。

### Multi-item（跨图层）

4. **互斥槽位**：HEADLINE 和 NAME 都属于 `lower` 槽位。新上屏的一方接管，原来那条自动交接退场（两段动画重叠约 200ms）。
5. **预留空间**：TICKER 上屏时，标题条、人名条和全屏的页脚会上移让出空间。**先让位、再入场**；字幕条下屏时顺序相反：**先离开、再回落**。
6. **挂起与恢复**：FULLSCREEN 上屏时，标题条和人名条让开，BUG 的直播角标收起；全屏下屏时它们自动回来。挂起期间，这些条目在 SPX 里仍然是播出状态，操作员不需要额外操作。

另外遵循 SPX 文档的最佳实践：每个模板都有 `playing` 标志，重复 Stop 或 Panic 不会让画面闪一下再退场。

## 字段

| 模板 | 字段 |
|---|---|
| HEADLINE | f1 标题 · f2 补充信息 · f0 栏目 · f3 地点 · f4 状态（直播 / 报道 / 特别报道 / 突发）。字段编号和旧版 Newsline 标题条一致，原有的 rundown 可以直接用。 |
| NAME | f0 姓名 · f1 职务 / 单位 · f3 补充 · f2 身份标签 |
| TICKER | f0 内容（每行一条）· f1 标签 · f2 模式（滚动 / 翻页）· f3 速度。播出中更新的内容会在队尾无缝接上。 |
| FULLSCREEN | f1 标题（最多两行）· f0 栏目 · f2–f6 要点 1–5 · f7 来源。要点全部留空时切换成标题卡版式。 |
| BUG | f0 左上角标 · f1 直播标识 · f2 显示时钟 · f3 时钟标签 · f4 时区 |

## 动效

- 所有时长都落在 25fps 的帧格上（1 帧 = 40ms），统一在 `scene.js` 的 `T` 表里定义，并同步写入 CSS 变量 `--t-*`。
- 入场用 expo-out，退场用 ease-in（退场比入场快），布局位移和擦除用 in-out。
- 动画属性只用 `transform`、`opacity` 和 `clip-path`，外加小元素的宽度形变。
- 所有状态变化都可以中途打断，比如入场过程中收到 Stop，会从当前位置直接开始退场。

## 品牌定制

改 `_scene/scene.css` 开头的 `:root`（信号色、底板色、字体），全部模板会一起跟着变。台标字样在 `BUG.html` 和 `FULLSCREEN.html` 里。

字体：思源黑体（Noto Sans SC）500/700 和 Inter 500/600/700，都是 woff2，按 `unicode-range` 子集按需加载，共约 5.3MB，采用 SIL OFL 1.1 授权（见 `_scene/fonts/OFL-*.txt`）。字体打包在模板里，所以不管 OBS、vMix 还是 CasparCG 所在的机器装了什么字体，渲染结果都一样。

## 文件

```
newsline/
├── BUG.html  NAME.html  HEADLINE.html  TICKER.html  FULLSCREEN.html   ← 在 SPX 里添加这五个
├── _demo.html            预览台（以下划线开头，不会出现在 SPX 模板列表里）
└── _scene/
    ├── scene.js          Scene 运行时：状态总线、控制器状态机、SPX 接口
    ├── scene.css         品牌与运动令牌、共享组件
    ├── lower.css         下三分之一共享组件（HEADLINE / NAME）
    ├── fonts.css
    └── fonts/
```

## 说明

- SPX 调用顺序以渲染器源码为准：Play 会重载 iframe，然后调用 `update(json)` 和 `play()`；Continue 调用 `next()`；Stop 调用 `stop()`；播出中修改调用 `update(json)`。HTML 格式文档里写的 `spxRenderer.on('play')` 这套写法，渲染器实际上并没有调用。
- 同层接力依赖同一个浏览器标签页里的 `sessionStorage`（SPX web 渲染器、OBS、vMix 都满足）。CasparCG 每个 HTML producer 都是独立页面，没有这一条，会退回正常的入场动画；跨图层规则在 CasparCG 里改走 `BroadcastChannel`（这条路径还没有在 CasparCG 上实测）。
- 模板刻意没有响应 `prefers-reduced-motion`：播出机上的系统设置不应该悄悄关掉节目里的动画。
