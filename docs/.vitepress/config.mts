import { defineConfig } from 'vitepress'
import { sidebar } from './sidebar'
import imageProcessor from './plugins/imageProcessor'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "游晓竹Coding",
    description: "Java后端面试指南",
    base: "/",
    head: [
        ['link', { rel: 'icon', href: 'https://restful.doublefenzhuan.me/public/72e7cb37-9f66-430e-b06a-f637be011309-image.png' }],
    ],
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        // 网站的logo
        logo: "https://restful.doublefenzhuan.me/public/72e7cb37-9f66-430e-b06a-f637be011309-image.png",
        // 文章右侧大纲目录
        outline: {
            level: [2, 6],
            label: "目录",
        },
        //自定义上下页名
        docFooter: {
            prev: "上一页",
            next: "下一页",
        },

        // 主题
        darkModeSwitchLabel: "深浅模式",
        // 返回顶部label
        returnToTopLabel: "返回顶部",
        // 搜索
        search: {
            provider: "local",
        },
        // 页脚
        footer: {
            message: "Released under the MIT License.",
            copyright: "Copyright © 2025-present China Carlos",
        },
        // 文档的最后更新时间
        lastUpdated: {
            text: "Updated at",
            formatOptions: {
                dateStyle: "full",
                timeStyle: "medium",
            },
        },
        nav: [
            { text: '首页', link: '/' },
            { text: '指南', link: '/guide/' },
            { text: '关于', link: '/about' }
        ],

        sidebar,

        socialLinks: [
            { icon: 'github', link: 'https://github.com/cunninger' }
        ],
    },
})
