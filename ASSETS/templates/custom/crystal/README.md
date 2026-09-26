# CRYSTAL 晶华新闻 · SPX 传统新闻台包装

传统电视新闻台风格：宝蓝玻璃条、玻璃高光分界线、香槟金线、绯红玻璃标签、白玻璃副条，外加光效（金线光晕、玻璃扫光、徽章光爆、全屏光芒与光斑）。

和 [Newsline](../newsline/README.md) 是两套独立的包，逻辑相同、视觉不同。两者使用同一套 Scene 运行时和 transition logic 规则，字段也完全兼容：同一条 rundown 数据在两个包之间可以直接互换。

预览台：`http://localhost:5656/templates/custom/crystal/_demo.html`

## 图层规划（SPX Solo，5 个图层）

| 图层 | 模板 | 内容 | Scene 角色 |
|---|---|---|---|
| 5 | `BUG.html` | 左上徽章台标、直播 / 地点角标；右上时钟（可选，默认关闭） | 常驻；全屏上屏时角标收起 |
| 4 | `NAME.html` | 人名条：身份标签、姓名条、职务条 | `lower` 槽位 |
| 3 | `HEADLINE.html` | 标题条：栏目、标题、状态与地点、补充信息 | `lower` 槽位 |
| 2 | `TICKER.html` | 字幕条：台标、快讯标签、滚动 / 翻页内容、时钟 | 占用底部 92px |
| 1 | `FULLSCREEN.html` | 全屏图文，Continue 逐条揭示要点 | 上屏时让 `lower` 挂起 |

## Transition Logic

规则和 Newsline 相同，详见 [Newsline README](../newsline/README.md#transition-logic)：

- 原地切换
- 同层接力
- Continue 分步
- 互斥槽位交接
- 字幕条先让位、后入场
- 全屏挂起与恢复

## 动效与光效

- **入场**：金线从左向右画出，线头带光晕和横向拉丝；红色标签和蓝玻璃条跟在光晕后面展开，文字浮现，最后一道扫光掠过玻璃。
- **退场**：文字先溶解，玻璃条再向左收回，最后金线收起。
- **切换**：溶解式过渡，旧字先淡出、新字后浮现，两者不会叠影；宽度随内容形变，同时伴随一次扫光。
- **常驻光效**：
  - 标题条、人名条每 9 秒掠过一次扫光。
  - 台标星芒每 12 秒闪动一次。
  - 金线持续缓慢流光。
- **全屏图文**：
  - 整屏溶入，伴随一次光爆。
  - 背景有缓慢旋转的光芒、漂浮的光斑和横贯的镜头光带。
  - 当前要点衬蓝玻璃并掠过扫光。

玻璃质感完全由分层渐变和内描边实现，没有使用 `backdrop-filter`：抠像输出时模板看不到下面的视频，毛玻璃模糊不会生效。

## 字段

| 模板 | 字段 |
|---|---|
| HEADLINE | f1 标题 · f2 补充信息 · f0 栏目 · f3 地点 · f4 状态（直播 / 报道 / 特别报道 / 突发）。突发状态下，玻璃条转为绯红，栏目标签转为深蓝。 |
| NAME | f0 姓名 · f1 职务 / 单位 · f3 补充 · f2 身份标签（留空时整块收起） |
| TICKER | f0 内容（每行一条）· f1 标签 · f2 模式 · f3 速度 · f4 右侧时钟 · f5 时区 |
| FULLSCREEN | f1 标题（最多两行）· f0 栏目 · f2–f6 要点 1–5 · f7 来源。要点全部留空时切换为标题卡版式。 |
| BUG | f0 地点角标 · f1 直播标识 · f2 右上时钟 · f3 时钟标签 · f4 时区 |

## 品牌定制

- **配色**：改 `_scene/scene.css` 开头的 `:root`（宝蓝、绯红、香槟金）。
- **台名**：“晶华新闻 / CRYSTAL NEWS”分别写在以下几个文件里：
  - `BUG.html`
  - `TICKER.html`
  - `FULLSCREEN.html`
- **字体**：和 Newsline 相同，都是思源黑体加 Inter，SIL OFL 1.1 授权。

## 文件

```
crystal/
├── BUG.html  NAME.html  HEADLINE.html  TICKER.html  FULLSCREEN.html   ← 在 SPX 里添加这五个
├── _demo.html            预览台（以下划线开头，不会出现在 SPX 模板列表里）
└── _scene/
    ├── scene.js          Scene 运行时（与 Newsline 相同，但使用独立的命名空间，两套包不会串台）
    ├── scene.css         品牌令牌、玻璃与光效组件
    ├── lower.css         下三分之一共享组件
    ├── fonts.css
    └── fonts/
```

在 SPX 里建议两套包不要同时播出：它们的命名空间彼此独立，transition logic 只在同一套包内部起作用。
