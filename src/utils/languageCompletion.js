
// 注册函数 - 所有的配置都在函数内部定义，确保可以访问到传入的 monaco 实例
export function registerLanguageCompletions(monaco) {
    if (monaco.__bioCompletionsRegistered) return
    monaco.__bioCompletionsRegistered = true

    // R 语言补全
    const rCompletion = {
        keywords: [
            'if', 'else', 'repeat', 'while', 'function', 'for', 'in', 'next', 'break',
            'TRUE', 'FALSE', 'NULL', 'Inf', 'NaN', 'NA', 'library', 'require'
        ],
        functions: [
            { label: 'read.csv', insertText: 'read.csv("${1:file.csv}")', detail: '读取CSV文件' },
            { label: 'read.table', insertText: 'read.table("${1:file.txt}", header=TRUE)', detail: '读取表格数据' },
            { label: 'data.frame', insertText: 'data.frame(${1:col1}=${2:val1})', detail: '创建数据框' },
            { label: 'print', insertText: 'print(${1:obj})', detail: '打印' },
            { label: 'summary', insertText: 'summary(${1:obj})', detail: '摘要统计' },
            { label: 'plot', insertText: 'plot(${1:x}, ${2:y})', detail: '基础绘图' },
            // ggplot2
            { label: 'ggplot', insertText: 'ggplot(${1:data}, aes(x=${2:x}, y=${3:y}))', detail: 'ggplot2: 初始化' },
            { label: 'geom_point', insertText: 'geom_point()', detail: 'ggplot2: 散点图' },
            { label: 'geom_line', insertText: 'geom_line()', detail: 'ggplot2: 折线图' },
            { label: 'geom_bar', insertText: 'geom_bar(stat="identity")', detail: 'ggplot2: 条形图' },
            { label: 'theme_minimal', insertText: 'theme_minimal()', detail: 'ggplot2: 主题' },
            // dplyr
            { label: 'filter', insertText: 'filter(${1:condition})', detail: 'dplyr: 筛选' },
            { label: 'select', insertText: 'select(${1:columns})', detail: 'dplyr: 选择列' },
            { label: 'mutate', insertText: 'mutate(${1:new_col}=${2:expr})', detail: 'dplyr: 新增列' },
            { label: 'group_by', insertText: 'group_by(${1:col})', detail: 'dplyr: 分组' },
            { label: 'summarise', insertText: 'summarise(${1:stat}=${2:fun(col)})', detail: 'dplyr: 汇总' }
        ]
    }

    // Python 语言补全
    const pythonCompletion = {
        snippets: [
            {
                label: 'import pandas',
                insertText: 'import pandas as pd',
                detail: '导入 pandas'
            },
            {
                label: 'import numpy',
                insertText: 'import numpy as np',
                detail: '导入 numpy'
            },
            {
                label: 'pd.read_csv',
                insertText: 'pd.read_csv("${1:file.csv}")',
                detail: 'pandas: 读取CSV'
            },
            {
                label: 'def',
                insertText: 'def ${1:func_name}(${2:params}):\n\t"""${3:Docstring}"""\n\t${4:pass}',
                detail: '定义函数',
                kind: monaco.languages.CompletionItemKind.Snippet
            },
            {
                label: 'ifmain',
                insertText: 'if __name__ == "__main__":\n\t${1:main()}',
                detail: 'Main入口',
                kind: monaco.languages.CompletionItemKind.Snippet
            }
        ]
    }

    // Perl 语言补全
    const perlCompletion = {
        keywords: [
            'my', 'our', 'local', 'sub', 'if', 'else', 'elsif', 'unless', 'while',
            'foreach', 'for', 'return', 'use', 'package', 'strict', 'warnings'
        ],
        snippets: [
            {
                label: 'header',
                insertText: '#!/usr/bin/env perl\nuse strict;\nuse warnings;\n\n',
                detail: 'Perl 脚本头',
                kind: monaco.languages.CompletionItemKind.Snippet
            },
            {
                label: 'open',
                insertText: 'open(my $${1:fh}, "<", "${2:file}") or die "Cannot open $2: $!";\n',
                detail: '打开文件读',
                kind: monaco.languages.CompletionItemKind.Snippet
            },
            {
                label: 'while line',
                insertText: 'while (my $line = <$${1:fh}>) {\n\tchomp $line;\n\t${2:# code}\n}',
                detail: '逐行读取循环',
                kind: monaco.languages.CompletionItemKind.Snippet
            }
        ]
    }

    // R
    monaco.languages.registerCompletionItemProvider('r', {
        provideCompletionItems: (model, position) => {
            const suggestions = [
                ...rCompletion.keywords.map(k => ({
                    label: k,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: k
                })),
                ...rCompletion.functions.map(f => ({
                    label: f.label,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: f.insertText,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: f.detail
                }))
            ]
            return { suggestions }
        }
    })

    // Python (扩展)
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: (model, position) => {
            const suggestions = pythonCompletion.snippets.map(s => ({
                label: s.label,
                kind: s.kind || monaco.languages.CompletionItemKind.Function,
                insertText: s.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: s.detail
            }))
            return { suggestions }
        }
    })

    // Perl
    monaco.languages.registerCompletionItemProvider('perl', {
        provideCompletionItems: (model, position) => {
            const suggestions = [
                ...perlCompletion.keywords.map(k => ({
                    label: k,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: k
                })),
                ...perlCompletion.snippets.map(s => ({
                    label: s.label,
                    kind: s.kind || monaco.languages.CompletionItemKind.Snippet,
                    insertText: s.insertText,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: s.detail
                }))
            ]
            return { suggestions }
        }
    })

    // Shell/Bash
    monaco.languages.registerCompletionItemProvider('shell', {
        provideCompletionItems: (model, position) => {
            const keywords = ['echo', 'if', 'then', 'else', 'fi', 'for', 'in', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'exit', 'set'];
            const suggestions = keywords.map(k => ({
                label: k,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: k
            }));
            // Snippets
            suggestions.push({
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'if [ ${1:condition} ]; then\n\t${2}\nfi',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            });
            return { suggestions };
        }
    });

    console.log('Bio-language completions registered.')
}
