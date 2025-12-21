const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n⚠️  WARNING: Running tests will CLEAR ALL DATA from the database!\n');

rl.question('Do you want to continue? (y/n): ', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n✓ Starting tests...\n');
    process.exit(0);
  } else {
    console.log('\n✗ Tests cancelled.\n');
    process.exit(1);
  }
});
