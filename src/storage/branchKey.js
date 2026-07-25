"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchKey = branchKey;
const node_crypto_1 = require("node:crypto");
/** Converts a branch name into a safe, collision-resistant directory key. */
function branchKey(branchName) {
    const slug = branchName
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'branch';
    const digest = (0, node_crypto_1.createHash)('sha256').update(branchName, 'utf8').digest('hex').slice(0, 12);
    return `${slug}-${digest}`;
}
//# sourceMappingURL=branchKey.js.map