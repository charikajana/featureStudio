import * as monaco from 'monaco-editor';

export const registerGherkinLanguage = (monacoInstance: typeof monaco) => {
    // Register the language
    monacoInstance.languages.register({
        id: 'gherkin',
        extensions: ['.feature', '.gherkin'],
        aliases: ['Gherkin', 'feature'],
        mimetypes: ['text/x-gherkin-feature']
    });

    // Language configuration
    monacoInstance.languages.setLanguageConfiguration('gherkin', {
        comments: {
            lineComment: '#'
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '<', close: '>' }
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '<', close: '>' }
        ]
    });

    // Tokenizer
    // Tokenizer
    monacoInstance.languages.setMonarchTokensProvider('gherkin', {
        defaultToken: '',
        tokenPostfix: '.gherkin',

        tokenizer: {
            root: [
                // Comments
                [/^\s*#.*$/, 'comment'],

                // Tags (including colons and dashes)
                [/@[a-zA-Z0-9_\-:]+/, 'tag'],

                // Feature keyword
                [/^\s*(Feature)(:)/, ['keyword.feature', 'delimiter']],

                // Background, Scenario, Examples keywords
                [/^\s*(Scenario Outline|Scenario|Background|Examples)(:)/, ['keyword.scenario', 'delimiter']],

                // Step keywords
                [/^\s*(Given|When|Then|And|But)\b/, 'keyword.step'],

                // Docstrings
                [/"""/, { token: 'string.quote', bracket: '@open', next: '@docstring' }],

                // Strings (Double quotes)
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string_double' }],

                // Strings (Single quotes)
                [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }],

                // Parameters/Variables in angle brackets
                [/<[^>]+>/, 'variable'],

                // Table pipes
                [/\|/, 'delimiter.table'],

                // Numbers
                [/\d+/, 'number'],
            ],

            docstring: [
                [/[^"]+/, 'string'],
                [/"""/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
                [/"/, 'string']
            ],

            string_double: [
                [/[^\\"]+/, 'string'],
                [/\\./, 'string.escape'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ],

            string_single: [
                [/[^\\']+/, 'string'],
                [/\\./, 'string.escape'],
                [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ]
        }
    });

    // Theme Definition
    monacoInstance.editor.defineTheme('gherkin-vibrant', {
        base: 'vs',
        inherit: true,
        rules: [
            // Structural Keywords
            { token: 'keyword.feature', foreground: '7c3aed', fontStyle: 'bold' },
            { token: 'keyword.scenario', foreground: '4f46e5', fontStyle: 'bold' },

            // Step Keywords
            { token: 'keyword.step', foreground: '2563eb', fontStyle: 'bold' },

            // Tags - Teal/Cyan
            { token: 'tag', foreground: '0ea5e9', fontStyle: 'bold italic' },

            // Strings and Docstrings (Test Data) - Fuchsia
            { token: 'string', foreground: 'd946ef', fontStyle: 'bold' },
            { token: 'string.quote', foreground: 'd946ef', fontStyle: 'bold' },
            { token: 'string.escape', foreground: 'be185d' },

            // Comments
            { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },

            // Variables and Tables
            { token: 'variable', foreground: 'f59e0b', fontStyle: 'bold' },
            { token: 'delimiter.table', foreground: 'a78bfa', fontStyle: 'bold' },
            { token: 'delimiter', foreground: '94a3b8' },

            // Numbers
            { token: 'number', foreground: 'd946ef' }
        ],
        colors: {
            'editor.background': '#ffffff',
            'editor.lineHighlightBackground': '#f8fafc',
            'editorLineNumber.foreground': '#cbd5e1',
            'editorLineNumber.activeForeground': '#6366f1',
            'editorIndentGuide.background': '#f1f5f9',
            'editorIndentGuide.activeBackground': '#cbd5e1',
            'editor.selectionBackground': '#ddd6fe',
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
