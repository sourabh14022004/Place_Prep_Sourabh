const fs = require('fs');
const file = 'dashboard/faculty-portal/app/api/faculty/sessions/route.ts';
let code = fs.readFileSync(file, 'utf8');
if (!code.includes('force-dynamic')) {
  code = "export const dynamic = 'force-dynamic';\n" + code;
  fs.writeFileSync(file, code);
}
