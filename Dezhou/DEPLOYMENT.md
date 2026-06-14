# 上线流程

目标：让朋友通过手机或电脑浏览器打开公网链接一起玩。

## 1. 准备账号

- GitHub：https://github.com
- Supabase：https://supabase.com
- Vercel：https://vercel.com

建议用 GitHub 登录 Vercel，后面导入项目最省事。

## 2. 上传到 GitHub

如果电脑已经安装 Git：

```bash
cd C:\Users\王子航\Documents\Dezhou
git init
git add .
git commit -m "Initial web app"
git branch -M main
git remote add origin https://github.com/你的用户名/dezhou-web.git
git push -u origin main
```

如果没有安装 Git，也可以在 GitHub 网页创建仓库后，用 “uploading an existing file” 上传项目文件。

不要上传 `.env.local`。

## 3. 创建 Supabase 项目

1. 打开 https://supabase.com
2. New project
3. 等项目创建完成
4. 进入 SQL Editor
5. 执行 `supabase/schema.sql` 的全部内容

## 4. 开启 Realtime

在 Supabase 后台：

1. Database
2. Replication 或 Realtime
3. 找到 `room_events`
4. 开启 Insert 事件发布

前端只订阅 `room_events`，不会订阅牌堆或玩家手牌表。

## 5. 获取 Supabase 环境变量

在 Supabase：

1. Project Settings
2. API
3. 复制：
   - Project URL
   - anon public key
   - service_role key

## 6. Vercel 部署

1. 打开 https://vercel.com
2. Add New Project
3. Import Git Repository
4. 选择刚才的 GitHub 仓库
5. Framework Preset 选择 Next.js
6. 添加环境变量：

```text
NEXT_PUBLIC_SUPABASE_URL=你的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon public key
SUPABASE_SERVICE_ROLE_KEY=你的 service_role key
```

7. Deploy

## 7. 手机测试

部署完成后，Vercel 会给你一个链接，例如：

```text
https://dezhou-web.vercel.app
```

测试流程：

1. 手机 A 打开链接，输入昵称，创建房间
2. 把 6 位房间码发给朋友
3. 手机 B 打开同一链接，输入昵称和房间码加入
4. 房主点击开始一局
5. 两台手机确认：各自只能看到自己的手牌
6. 房主发翻牌、转牌、河牌
7. 房主摊牌，所有人看到牌型结果

## 8. 常见问题

如果 Vercel 构建失败：

- 检查环境变量是否都填了
- 检查 Supabase SQL 是否执行成功
- 检查 GitHub 仓库是否包含 `package.json`

如果加入房间失败：

- 确认房间码是 6 位
- 确认房间未满 6 人
- 确认 Supabase 环境变量填在 Vercel，而不是只填在本地

如果实时刷新不明显：

- 确认 Supabase 的 `room_events` 已开启 Realtime
- 手动点房间页面右上角“刷新”也能同步状态
