
import fs from 'fs';

const content = fs.readFileSync('m:\\DEV\\sistema_zeus_next_app-v\\sistema_zeus_next_app-v3.1\\sistema_zeus_next_app\\src\\components\\views\\ContractForm.tsx', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;

    if (braces < 0 || parens < 0 || brackets < 0) {
        console.log(`Mismatch at index ${i}, char ${char}, line ${content.substring(0, i).split('\n').length}`);
    }
}

console.log(`Braces: ${braces}, Parens: ${parens}, Brackets: ${brackets}`);
process.exit(0);
