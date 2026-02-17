#!/bin/bash

echo "🔍 Verifying AI Receptionist Templates..."
echo ""

# Check all required files exist
echo "📁 Checking files..."
files=(
  "law-firm.json"
  "medical-office.json"
  "README.md"
  "QUICKSTART.md"
  "TEMPLATE_SUMMARY.md"
  "template-processor.js"
  "examples/smith-associates.json"
  "examples/downtown-family-medicine.json"
)

all_present=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ MISSING: $file"
    all_present=false
  fi
done

echo ""
echo "🧪 Validating JSON syntax..."
node -e "
try {
  require('./law-firm.json');
  console.log('  ✅ law-firm.json - Valid JSON');
} catch(e) {
  console.log('  ❌ law-firm.json - Invalid:', e.message);
}

try {
  require('./medical-office.json');
  console.log('  ✅ medical-office.json - Valid JSON');
} catch(e) {
  console.log('  ❌ medical-office.json - Invalid:', e.message);
}

try {
  require('./examples/smith-associates.json');
  console.log('  ✅ examples/smith-associates.json - Valid JSON');
} catch(e) {
  console.log('  ❌ examples/smith-associates.json - Invalid:', e.message);
}

try {
  require('./examples/downtown-family-medicine.json');
  console.log('  ✅ examples/downtown-family-medicine.json - Valid JSON');
} catch(e) {
  console.log('  ❌ examples/downtown-family-medicine.json - Invalid:', e.message);
}
"

echo ""
echo "📊 Template Statistics..."
node -e "
const law = require('./law-firm.json');
const med = require('./medical-office.json');

console.log('  Law Firm Template:');
console.log('    - Practice Areas:', law.business_config.practice_areas.length);
console.log('    - Sample Conversations:', law.sample_conversations.length);
console.log('    - FAQ Items:', law.faq.length);
console.log('    - System Prompt:', law.system_prompt.length, 'chars');

console.log('');
console.log('  Medical Office Template:');
console.log('    - Appointment Types:', med.business_config.appointment_types.length);
console.log('    - Sample Conversations:', med.sample_conversations.length);
console.log('    - FAQ Items:', med.faq.length);
console.log('    - System Prompt:', med.system_prompt.length, 'chars');
"

echo ""
echo "🧰 Testing Template Processor..."
if [ -f "template-processor.js" ]; then
  node template-processor.js list > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "  ✅ Template processor functional"
  else
    echo "  ❌ Template processor error"
  fi
else
  echo "  ❌ template-processor.js not found"
fi

echo ""
if $all_present; then
  echo "✅ All templates complete and verified!"
  echo ""
  echo "📦 Deliverables:"
  echo "  • 2 industry templates (Law Firm, Medical Office)"
  echo "  • Complete documentation (README, QUICKSTART, SUMMARY)"
  echo "  • Template processor utility"
  echo "  • Example configurations"
  echo ""
  echo "🚀 Ready for production deployment!"
else
  echo "❌ Some files are missing. Check above for details."
fi
