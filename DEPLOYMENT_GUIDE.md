# 部署指南

## 问题解决

### 图片不显示问题已修复 ✅

**问题原因：**
- 项目中使用了绝对路径 `/src/assets/` 引用图片
- 部署到Git Pages等子路径时，这些绝对路径会失效
- Vite配置中设置了生产环境base路径为 `/muguzhuangyuan/`

**解决方案：**
- 将所有 `/src/assets/` 路径替换为 `@/assets/`
- `@/assets/` 是Vite的别名，会被正确处理并支持子路径部署

**修复的文件：**
- `src/components/BeautifulAvatar.vue`
- `src/components/TeaAIAssistant.vue`
- `src/components/GlobalIPAssistant.vue`
- `src/config/digital-human.config.ts`
- `src/components/IPAvatarSelector.vue`
- `src/views/HomeView.vue`
- `src/views/user/OrdersView.vue`
- `src/services/ProductAIService.ts`
- `src/views/SurroundingProductsView.vue`
- `src/views/user/ProductsView.vue`
- `src/data/mockData.ts`
- `src/views/TeaCultureView.vue`
- `src/views/TeaExperienceBookingView.vue`
- `public/ip-avatar-dify-test.html`

## 部署步骤

### 1. 构建项目
```bash
npm run build
```

### 2. 部署到GitHub Pages
1. 将 `dist` 目录的内容推送到 `gh-pages` 分支
2. 或者使用GitHub Actions自动部署

### 3. 验证部署
- 检查图片是否正常显示
- 确认所有资源文件路径正确

## 配置说明

### Vite配置 (vite.config.ts)
```typescript
base: mode === 'production' ? '/muguzhuangyuan/' : '/'
```

这个配置确保：
- 开发环境使用根路径 `/`
- 生产环境使用子路径 `/muguzhuangyuan/`

### 资源引用规范
✅ **正确方式：**
```vue
<img src="@/assets/images/logo.png" alt="Logo">
```

❌ **错误方式：**
```vue
<img src="/src/assets/images/logo.png" alt="Logo">
```

## 注意事项

1. **始终使用 `@/assets/` 引用静态资源**
2. **避免使用绝对路径 `/src/assets/`**
3. **构建前确保所有图片文件存在**
4. **部署后验证图片加载是否正常**

## 故障排除

如果部署后仍有图片不显示：
1. 检查浏览器开发者工具的Network面板
2. 查看是否有404错误
3. 确认图片文件是否正确打包到dist目录
4. 检查路径是否使用了正确的别名 `@/assets/`
