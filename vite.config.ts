
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
  define: {
    // 将 Vercel 的系统环境变量注入到前端代码中
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
