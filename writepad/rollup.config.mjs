import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'server.mjs',
    output: {
        file: 'writepad-server.js',
        format: 'cjs'
    },
    plugins: [commonjs(), nodeResolve()]
};
