/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS Node audit tool. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const elements = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(file);
    else if(/\.tsx$/.test(file)) {
      const tree=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
      function visit(node) {
        if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)) {
          const tag=node.tagName.getText(tree);
          if(['Button','ActionButton','a','Link','Input','TextArea','TextField','Select','Tabs','form','Modal.CloseTrigger','g'].includes(tag)) {
            const attrs=node.attributes.properties.map(a=>a.name?.getText(tree)).filter(Boolean);
            const line=tree.getLineAndCharacterOfPosition(node.pos).line+1;
            const candidate=['Button','ActionButton'].includes(tag)&&!attrs.some(a=>['onPress','onClick','type','isDisabled'].includes(a))&&!attrs.includes('...props');
            elements.push({file:file.replaceAll('\\','/'),line,tag,attributes:attrs,needsReview:candidate});
          }
        }
        ts.forEachChild(node,visit);
      }
      visit(tree);
    }
  }
}
walk('components'); walk('app');
const report={kind:'static JSX templates; repeated instances counted once',count:elements.length,buttons:elements.filter(e=>['Button','ActionButton'].includes(e.tag)).length,candidates:elements.filter(e=>e.needsReview),elements};
fs.writeFileSync('submission/evidence/local-source-click-inventory.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({count:report.count,buttons:report.buttons,candidates:report.candidates},null,2));
