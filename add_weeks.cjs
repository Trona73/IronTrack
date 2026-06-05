const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const week2Regex = /<section>[\s\S]*?<h2 className="text-xl font-semibold">Semana 02<\/h2>[\s\S]*?<\/section>/;
const match = code.match(week2Regex);

if (match) {
  let week2Block = match[0];
  
  let week3Block = week2Block
    .replace(/isWeek2Expanded/g, 'isWeek3Expanded')
    .replace(/setIsWeek2Expanded/g, 'setIsWeek3Expanded')
    .replace(/Semana 02/g, 'Semana 03')
    .replace(/week2StartDate/g, 'week3StartDate')
    .replace(/\[8, 9, 10, 11, 12, 13, 7\]/g, '[15, 16, 17, 18, 19, 20, 14]')
    .replace(/Monday \(8\) to Sunday \(7\)/g, 'Monday (15) to Sunday (14)');
    
  let week4Block = week2Block
    .replace(/isWeek2Expanded/g, 'isWeek4Expanded')
    .replace(/setIsWeek2Expanded/g, 'setIsWeek4Expanded')
    .replace(/Semana 02/g, 'Semana 04')
    .replace(/week2StartDate/g, 'week4StartDate')
    .replace(/\[8, 9, 10, 11, 12, 13, 7\]/g, '[22, 23, 24, 25, 26, 27, 21]')
    .replace(/Monday \(8\) to Sunday \(7\)/g, 'Monday (22) to Sunday (21)');
    
  code = code.replace(week2Block, week2Block + '\n\n      ' + week3Block + '\n\n      ' + week4Block);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Successfully added Week 3 and Week 4 sections.');
} else {
  console.log('Week 2 block not found!');
}
