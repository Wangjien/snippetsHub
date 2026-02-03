/**
 * ZIP导出工具函数
 * 使用JSZip生成真正的ZIP压缩包
 */
import JSZip from 'jszip'

/**
 * 获取文件扩展名
 */
const getFileExtension = (language) => {
    const extensions = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        csharp: 'cs',
        ruby: 'rb',
        go: 'go',
        rust: 'rs',
        php: 'php',
        swift: 'swift',
        kotlin: 'kt',
        scala: 'scala',
        html: 'html',
        css: 'css',
        scss: 'scss',
        less: 'less',
        json: 'json',
        xml: 'xml',
        yaml: 'yaml',
        markdown: 'md',
        sql: 'sql',
        shell: 'sh',
        bash: 'sh',
        powershell: 'ps1',
        r: 'r',
        matlab: 'm',
        perl: 'pl',
        lua: 'lua',
        dart: 'dart',
        vue: 'vue',
        react: 'jsx'
    }

    return extensions[language?.toLowerCase()] || 'txt'
}

/**
 * 获取注释起始符号
 */
const getCommentStart = (language) => {
    const multiLineComments = {
        javascript: '/*',
        typescript: '/*',
        java: '/*',
        c: '/*',
        cpp: '/*',
        csharp: '/*',
        css: '/*',
        php: '/*',
        sql: '/*',
        html: '<!--',
        python: '"""',
        ruby: '=begin',
        shell: '#',
        bash: '#',
        r: '#'
    }

    return multiLineComments[language?.toLowerCase()] || '/*'
}

/**
 * 获取注释结束符号
 */
const getCommentEnd = (language) => {
    const multiLineComments = {
        javascript: ' */',
        typescript: ' */',
        java: ' */',
        c: ' */',
        cpp: ' */',
        csharp: ' */',
        css: ' */',
        php: ' */',
        sql: ' */',
        html: '-->',
        python: '"""',
        ruby: '=end',
        shell: '',
        bash: '',
        r: ''
    }

    return multiLineComments[language?.toLowerCase()] || ' */'
}

/**
 * 生成真正的ZIP压缩包
 * @param {Array} snippets - 代码片段数组
 * @returns {Promise<Blob>} - ZIP文件的Blob对象
 */
export const generateZipFile = async (snippets) => {
    const zip = new JSZip()

    // 创建README文件
    let readmeContent = `# SnippetsHub 代码片段导出

## 导出信息
- **导出时间**: ${new Date().toLocaleString('zh-CN')}
- **片段数量**: ${snippets.length}
- **导出格式**: ZIP压缩包

## 文件说明
此压缩包包含 ${snippets.length} 个代码片段文件。  
每个文件都保持原始的文件扩展名和编码格式。

## 文件列表

`

    // 统计语言分布
    const languageCount = {}
    snippets.forEach(snippet => {
        const lang = snippet.language
        languageCount[lang] = (languageCount[lang] || 0) + 1
    })

    readmeContent += `### 按语言分类\n\n`
    Object.entries(languageCount).forEach(([lang, count]) => {
        readmeContent += `- **${lang}**: ${count} 个文件\n`
    })

    readmeContent += `\n### 文件清单\n\n`

    // 添加每个代码片段为独立文件
    const fileNameCounts = {}

    snippets.forEach((snippet, index) => {
        // 生成安全的文件名
        let baseFileName = snippet.title
            .replace(/[<>:"/\\|?*]/g, '-')  // 替换Windows不允许的字符
            .replace(/\s+/g, '_')  // 空格替换为下划线
            .substring(0, 100)  // 限制长度

        const ext = getFileExtension(snippet.language)

        // 处理文件名重复
        let fileName = `${baseFileName}.${ext}`
        if (fileNameCounts[fileName]) {
            fileNameCounts[fileName]++
            fileName = `${baseFileName}_${fileNameCounts[fileName]}.${ext}`
        } else {
            fileNameCounts[fileName] = 1
        }

        // 添加文件到ZIP
        let fileContent = snippet.code

        // 如果有描述，添加为注释头部
        if (snippet.description) {
            const commentStart = getCommentStart(snippet.language)
            const commentEnd = getCommentEnd(snippet.language)
            const header = `${commentStart}\n * ${snippet.title}\n * ${snippet.description}\n * 语言: ${snippet.language}\n * 标签: ${snippet.tags?.join(', ') || '无'}\n * 更新时间: ${new Date(snippet.updated_at * 1000).toLocaleString('zh-CN')}\n${commentEnd}\n\n`
            fileContent = header + fileContent
        }

        zip.file(fileName, fileContent)

        // 添加到README
        readmeContent += `${index + 1}. **${snippet.title}** (\`${fileName}\`)\n`
        if (snippet.description) {
            readmeContent += `   - ${snippet.description}\n`
        }
    })

    readmeContent += `\n---\n*由 SnippetsHub 导出 | ${new Date().toLocaleString('zh-CN')}*\n`

    // 添加README到ZIP
    zip.file('README.md', readmeContent)

    // 生成ZIP文件的Blob
    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 6
        }
    })

    return blob
}
