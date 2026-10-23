# Sideload

`celia-sh` 应用的侧载入口页与 AltSource。

- Source：<https://sideload.celia.sh/source.json>
- Apps：Novella、Hana
- Support：AltStore、SideStore、Feather

## 开发

```bash
pnpm install
pnpm dev
pnpm build
```

Cloudflare Pages 使用 `pnpm build`，输出目录为 `dist`。GitHub Actions 每 12 小时检查上游 Release；检测到新 IPA 后更新 `public/source.json` 并部署。
