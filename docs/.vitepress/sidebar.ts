import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 文档基础目录
const guideDir = path.join(__dirname, '../guide')

interface SidebarItem {
    text: string
    collapsed?: boolean
    link?: string
    items?: SidebarItem[]
}

function generateSidebar(): Record<string, SidebarItem[]> {
    const sidebar: Record<string, SidebarItem[]> = {
        '/guide/': []
    }

    // 获取 guide 文件夹下的所有内容
    const entries = fs.readdirSync(guideDir, { withFileTypes: true })

    // 为每个条目创建侧边栏项目
    for (const entry of entries) {
        const fullPath = path.join(guideDir, entry.name)
        const relativePath = path.relative(guideDir, fullPath)

        if (entry.isDirectory()) {
            // 如果是目录，递归处理
            sidebar['/guide/'].push(processDirectory(fullPath, entry.name))
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
            // 如果是 markdown 文件，直接添加到根目录
            const link = `/guide/${relativePath.replace(/\\/g, '/')}`.replace(/\.md(x)?$/, '')
            sidebar['/guide/'].push({
                text: formatText(entry.name.replace(/\.md(x)?$/, '')),
                link: link
            })
        }
    }

    // 对根目录下的项目排序
    sidebar['/guide/'].sort((a, b) => a.text.localeCompare(b.text))

    return sidebar
}

function processDirectory(dirPath: string, dirName: string): SidebarItem {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const result: SidebarItem = {
        text: formatText(dirName),
        collapsed: true,
        items: []
    }

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativePath = path.relative(guideDir, fullPath)

        if (entry.isDirectory()) {
            // 如果是子目录，递归处理
            result.items!.push(processDirectory(fullPath, entry.name))
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
            // 如果是 markdown 文件，添加到当前目录
            const link = `/guide/${relativePath.replace(/\\/g, '/')}`.replace(/\.md(x)?$/, '')
            result.items!.push({
                text: formatText(entry.name.replace(/\.md(x)?$/, '')),
                link: link
            })
        }
    }

    // 对当前目录下的项目排序
    if (result.items) {
        result.items.sort((a, b) => a.text.localeCompare(b.text))
    }

    return result
}

// 格式化显示文本
function formatText(text: string): string {
    return text
        .replace(/-/g, ' ') // 替换连字符为空格
        .replace(/\b\w/g, c => c.toUpperCase()) // 首字母大写
        .replace(/\./g, ' ') // 替换点号为空格
}

export const sidebar = generateSidebar()