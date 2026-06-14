# 德州扒鸡 Web App

这是一个面向朋友局的网页牌桌工具。第一阶段只做房间、发牌、公共牌和摊牌牌型判断，不做自动筹码、自动行动轮或任何真实价值相关功能。

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Realtime
- Vercel

## 第一阶段功能

- 输入昵称
- 创建房间并生成 6 位房间码
- 输入房间码加入房间
- 每个房间支持 2 到 6 人
- 房主开始一局
- 系统给每位玩家发 2 张手牌
- 摊牌前每位玩家只能看到自己的手牌
- 房主依次发翻牌、转牌、河牌
- 房主摊牌后显示所有玩家手牌并判断最大牌型
- 娱乐筹码手动记录
- 适配电脑和手机浏览器

## 本地启动

```bash
npm install
npm run dev
```

然后打开：

```text
http://localhost:3000
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`：Supabase service role key，只放在服务端环境变量里，不要暴露给浏览器

## Supabase 建表

在 Supabase SQL Editor 执行：

```text
supabase/schema.sql
```

前端只订阅 `room_events` 表。真正的房间、玩家、牌局和手牌数据都通过 Next.js API Route 返回“当前玩家可见状态”，避免摊牌前泄露其他玩家手牌或牌堆。

在 Supabase 后台的 Realtime 设置里，把 `room_events` 表加入实时发布。前端收到事件后会重新调用状态接口。

## 主要目录

```text
app/
  page.tsx
  room/[code]/page.tsx
  room/[code]/room-client.tsx
  api/rooms/

components/
  PlayingCard.tsx
  PlayerSeat.tsx
  PokerTable.tsx
  HostControls.tsx
  MyHand.tsx

lib/
  api/
  poker/
  supabase/

supabase/
  schema.sql
```

## 部署到 Vercel

完整上线步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 第一阶段不做

- 自动筹码结算
- 自动下注轮
- 登录账户
- 支付、充值、提现
- 公开大厅
- 匹配系统

## 旧小程序文件

仓库里仍保留了之前的微信小程序文件，例如 `app.json`、`pages/`、`utils/`。当前方向已经切换到 Web App，后续可以在确认不需要小程序版本后再清理。
