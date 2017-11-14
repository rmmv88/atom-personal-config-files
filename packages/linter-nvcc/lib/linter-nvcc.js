'use babel';

export default {
    config: {
        ExecPath: {
            type: 'string',
            default: 'nvcc',
        },
        IncludePaths: {
            type: 'array',
            default: ['.'],
        },
        SuppressWarnings: {
            type: 'boolean',
            default: false,
        },
        DefaultFlags: {
            type: 'string',
            default: '-std=c++11',
        },
    },

    activate() {
        require('atom-package-deps').install('linter-nvcc');
    },

    provideLinter() {
        const tmp = require('tmp');
        const path = require('path');
        const helpers = require('atom-linter');
        const nvccFlags = require('./nvcc-flags');

        const regex_nvcc = /^([^\s]+)\((\d+)\):\s([a-z]+):\s+(.*)/mg;
        const regex_gcc  = /^([^\s]+):(\d+):(\d+):\s*\w*\s*(\w+):(.*)/mg;

        return {
            name: 'nvcc',
            grammarScopes: ['source.cuda'],
            scope: 'file',
            lintOnFly: false,
            lint: async (activeEditor) => {
                const command = atom.config.get('linter-nvcc.ExecPath');
                const filePath = activeEditor.getPath();
                const tmpPath = tmp.tmpNameSync();
                const args = [
                    '--cuda',
                    '-o', tmpPath,
                ];

                args.push(...atom.config.get('linter-nvcc.DefaultFlags').split(/\s+/));

                if (atom.config.get('linter-nvcc.SuppressWarnings')) {
                    args.push('-w');
                }

                atom.config.get('linter-nvcc.IncludePaths').forEach(path =>
                    args.push(`-I${path}`),
                );

                let working_dir = path.dirname(filePath);
                try {
                    const [flags, _dir] = nvccFlags.getNvccFlags(filePath);
                    if (flags && _dir) {
                        args.push(...flags);
                        working_dir = _dir;
                    }
                } catch (error) {
                    console.log(error);
                }

                // The file is added to the arguments last.
                args.push(filePath);
                const execOpts = {
                    stream: 'stderr',
                    allowEmptyStderr: true,
                    cwd: working_dir,
                };

                let result = await helpers.exec(command, args, execOpts);

                const messages = [];

                let match = regex_nvcc.exec(result);
                while (match != null) {
                    const line = Number.parseInt(match[2], 10) - 1 || 0;
                    messages.push({
                        type: match[3],
                        text: match[4],
                        filePath: match[1],
                        range: [
                            [line, 0], [line, 0]
                        ],
                    });
                    match = regex_nvcc.exec(result);
                }

                match = regex_gcc.exec(result);
                while (match != null) {
                    const line = Number.parseInt(match[2], 10) - 1 || 0;
                    const col = Number.parseInt(match[3], 10) - 1 || 0;
                    messages.push({
                        type: match[4],
                        text: match[5],
                        filePath: match[1],
                        range: [
                            [line, col], [line, col]
                        ],
                    });
                    match = regex_gcc.exec(result);
                }
                return Promise.all(messages);
            },
        };
    },
};;
