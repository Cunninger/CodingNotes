import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "游晓竹Coding",
    description: "Java后端面试指南",
    base: "/CodingNotes/",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        // 网站的logo
        logo: "/logo.svg",
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
            copyright: "Copyright © 2023-present China Carlos",
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
            {text: '首页', link: '/'},
            {text: '指南', link: '/guide/'},
            {text: '关于', link: '/about'}
        ],

        sidebar: {
            '/guide/': [
                {
                    text: 'Java核心',
                    items: [
                        {text: 'JVM', link: '/guide/Java核心/JVM'},
                        {text: '并发编程', link: '/guide/Java核心/并发编程.md'},
                        {text: '集合框架', link: '/guide/Java核心/集合框架'}
                    ]
                },
                {
                    text: '每日八股',
                    items: [
                        {text: '2025年5月5日', link: '/guide/每日八股/2025年5月5日'},
                    ]
                },
                // {
                //     text: '操作系统',
                //     items: [
                //         {text: '操作系统基础', link: '/guide/操作系统/操作系统基础'},
                //         {text: '进程管理', link: '/guide/操作系统/进程管理'},
                //         {text: '内存管理', link: '/guide/操作系统/内存管理'}
                //     ]
                // },
                // {
                //     text: '计算机网络',
                //     items: [
                //         {text: '网络基础', link: '/guide/计算机网络/网络基础'},
                //         {text: 'TCP/IP', link: '/guide/计算机网络/TCPIP'},
                //         {text: 'HTTP/HTTPS', link: '/guide/计算机网络/HTTPHTTPS'}
                //     ]
                // },
                // {
                //     text: '数据结构',
                //     items: [
                //         {text: '基础数据结构', link: '/guide/数据结构/基础数据结构'},
                //         {text: '排序算法', link: '/guide/数据结构/排序算法'},
                //         {text: '查找算法', link: '/guide/数据结构/查找算法'}
                //     ]
                // },

            ]
        },

        socialLinks: [
            {icon: 'github', link: 'https://github.com/cunninger'}
        ],
    }
})
