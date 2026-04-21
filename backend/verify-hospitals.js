const hospitals = require('./data/hospitals.js');

const states = {};
hospitals.forEach(h => {
  states[h.state] = (states[h.state] || 0) + 1;
});

const sorted = Object.entries(states).sort((a, b) => a[0].localeCompare(b[0]));

console.log('\n════════════════════════════════════════════════════');
console.log('🏥 HOSPITAL DATABASE VERIFICATION');
console.log('════════════════════════════════════════════════════\n');

console.log('STATES & HOSPITAL COUNT:\n');
sorted.forEach(([state, count]) => {
  console.log(`  ✓ ${state.padEnd(25)} : ${count} hospitals`);
});

console.log('\n════════════════════════════════════════════════════');
console.log(`Total: ${hospitals.length} hospitals across ${Object.keys(states).length} states/UTs`);
console.log('════════════════════════════════════════════════════\n');

// Show sample hospitals from each state
console.log('SAMPLE HOSPITALS BY STATE:\n');
sorted.forEach(([state]) => {
  const sample = hospitals.find(h => h.state === state);
  if (sample) {
    console.log(`  ${state}: ${sample.name} (${sample.city})`);
  }
});

console.log('\n✅ Database verification complete!');
