import * as monaco from 'monaco-editor';

export const registerGherkinLanguage = (monacoInstance: typeof monaco) => {
    monacoInstance.languages.register({
        id: 'gherkin',
        extensions: ['.feature', '.gherkin'],
        aliases: ['Gherkin', 'feature'],
        mimetypes: ['text/x-gherkin-feature']
    });

    monacoInstance.languages.setMonarchTokensProvider('gherkin', {
        defaultToken: '',
        tokenPostfix: '.gherkin',
        keywords: [
            'Feature', 'Background', 'Scenario', 'Scenario Outline', 'Examples',
            'Given', 'When', 'Then', 'And', 'But'
        ],
        tokenizer: {
            root: [
                // Comments must come first
                [/#.*$/, 'comment'],

                // Tags
                [/@[a-zA-Z_]\w*/, 'tag'],

                // Keywords - Feature, Scenario, Background, etc
                [/^\s*(Feature|Scenario Outline|Scenario|Background|Examples)(:)/,
                    ['keyword', 'delimiter']],

                // Step keywords - Given, When, Then, And, But
                [/^\s*(Given|When|Then|And|But)(\s)/,
                    ['keyword.step', 'white']],

                // Strings in double quotes
                [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
                [/"/, 'string', '@string_double'],

                // Parameters/Variables in angle brackets
                [/<[^>]+>/, 'variable'],

                // Table pipes
                [/\|/, 'delimiter.table'],

                // Numbers
                [/\d+/, 'number'],
            ],

            string_double: [
                [/[^\\"]+/, 'string'],
                [/\\./, 'string.escape'],
                [/"/, 'string', '@pop']
            ],
        }
    });

    monacoInstance.editor.defineTheme('gherkin-vibrant', {
        base: 'vs',
        inherit: true,
        rules: [
            // Keywords (Feature, Scenario, Background, Examples)
            { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },

            // Step keywords (Given, When, Then, And, But)
            { token: 'keyword.step', foreground: '2563eb', fontStyle: 'bold' },

            // Tags (@tag)
            { token: 'tag', foreground: '06b6d4', fontStyle: 'italic bold' },

            // Strings
            { token: 'string', foreground: '059669' },
            { token: 'string.escape', foreground: 'ea580c' },
            { token: 'string.invalid', foreground: 'dc2626', fontStyle: 'underline' },

            // Parameters/Variables (<param>)
            { token: 'variable', foreground: 'd97706', fontStyle: 'bold' },

            // Comments
            { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },

            // Table delimiters
            { token: 'delimiter.table', foreground: '8b5cf6', fontStyle: 'bold' },
            { token: 'delimiter', foreground: '64748b' },

            // Numbers
            { token: 'number', foreground: 'c026d3' },
        ],
        colors: {
            'editor.background': '#ffffff',
            'editor.lineHighlightBackground': '#f8fafc',
            'editorLineNumber.foreground': '#cbd5e1',
            'editorLineNumber.activeForeground': '#6366f1',
            'editorIndentGuide.background': '#f1f5f9',
            'editorIndentGuide.activeBackground': '#cbd5e1',
            'editorGroupHeader.tabsBackground': '#f8fafc',
            'editor.selectionBackground': '#ddd6fe',
            'editor.selectionHighlightBackground': '#e0e7ff',
            'editorCursor.foreground': '#6366f1',
        }
    });

    // Register Document Formatting Provider
    monacoInstance.languages.registerDocumentFormattingEditProvider('gherkin', {
        provideDocumentFormattingEdits(model) {
            const lines = model.getLinesContent();
            let formattedLines: string[] = [];
            let currentIndent = 0;

            const formatLine = (line: string): string => {
                const trimmed = line.trim();
                if (!trimmed) return "";

                // Tags
                if (trimmed.startsWith('@')) {
                    return "  ".repeat(Math.max(0, currentIndent)) + trimmed;
                }

                // Feature
                if (trimmed.startsWith('Feature:')) {
                    currentIndent = 0;
                    const result = trimmed;
                    currentIndent = 1;
                    return result;
                }

                // Scenarios & Background
                if (trimmed.startsWith('Background:') ||
                    trimmed.startsWith('Scenario:') ||
                    trimmed.startsWith('Scenario Outline:')) {
                    currentIndent = 1;
                    const result = "  ".repeat(currentIndent) + trimmed;
                    currentIndent = 2;
                    return result;
                }

                // Steps
                if (trimmed.startsWith('Given ') ||
                    trimmed.startsWith('When ') ||
                    trimmed.startsWith('Then ') ||
                    trimmed.startsWith('And ') ||
                    trimmed.startsWith('But ')) {
                    return "  ".repeat(2) + trimmed;
                }

                // Examples
                if (trimmed.startsWith('Examples:')) {
                    currentIndent = 2;
                    return "  ".repeat(currentIndent) + trimmed;
                }

                // Tables
                if (trimmed.startsWith('|')) {
                    // We don't do complex table alignment here to keep it simple but we indent them
                    return "  ".repeat(3) + trimmed;
                }

                return "  ".repeat(currentIndent) + trimmed;
            };

            formattedLines = lines.map(line => formatLine(line));

            // Optional: Table alignment logic
            // (Wait, let's actually implement basic table alignment as it's the most requested "Pretty" feature)
            const finalLines: string[] = [];
            let i = 0;
            while (i < formattedLines.length) {
                if (formattedLines[i].trim().startsWith('|')) {
                    const tableSet: string[] = [];
                    while (i < formattedLines.length && formattedLines[i].trim().startsWith('|')) {
                        tableSet.push(formattedLines[i].trim());
                        i++;
                    }

                    // Align this tableSet
                    const rows = tableSet.map(row => row.split('|').map(cell => cell.trim()));
                    const colWidths: number[] = [];
                    rows.forEach(row => {
                        row.forEach((cell, idx) => {
                            colWidths[idx] = Math.max(colWidths[idx] || 0, cell.length);
                        });
                    });

                    const alignedRows = rows.map(row => {
                        const alignedCells = row.map((cell, idx) => {
                            if (idx === 0 || idx === row.length - 1) return ""; // empty cells for outer pipes
                            return ` ${cell.padEnd(colWidths[idx])} `;
                        });
                        return "      |" + alignedCells.slice(1, -1).join('|') + "|";
                    });

                    finalLines.push(...alignedRows);
                } else {
                    finalLines.push(formattedLines[i]);
                    i++;
                }
            }

            return [
                {
                    range: model.getFullModelRange(),
                    text: finalLines.join('\n'),
                },
            ];
        },
    });
};
