#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SPEECH_PATTERNS = `\n\nSPEECH PATTERNS (CRITICAL):
- Start responses with filler: "Yeah", "Oh", "Hmm", "So", "Right"
- Use incomplete thoughts sometimes: "I can— actually, let me check on that"
- Vary sentence length. Mix short with long.
- Use casual contractions: "gonna", "wanna", "gotta", "y'know"
- React before answering: "Oh wow", "Yikes", "Nice", "Gotcha"
- Don't over-explain. Real receptionists are brief.
- Use "um" or "uh" occasionally (1 per 3-4 responses max)
- End some sentences trailing off: "so we could probably..."
- Interrupt yourself: "The appointment— oh wait, are you looking for morning or afternoon?"
- NEVER use bullet points or numbered lists in speech
- Keep it to 1-2 SHORT sentences. Max 30 words per response.
- Sound like you're multitasking: "Okay hang on one sec... *typing sounds* ...alright"`;

const templatesDir = __dirname;
const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json') && f !== 'package.json');

console.log(`Processing ${templates.length} templates...`);

for (const templateFile of templates) {
  const filePath = path.join(templatesDir, templateFile);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Check if speech patterns already added
    if (data.system_prompt.includes('SPEECH PATTERNS (CRITICAL)')) {
      console.log(`✓ ${templateFile} - already has speech patterns, skipping`);
      continue;
    }
    
    // Find the insertion point (after CRITICAL RULES section, before the "You're the receptionist" line)
    const lines = data.system_prompt.split('\n');
    const insertIndex = lines.findIndex(line => line.startsWith('You\'re the receptionist') || line.startsWith('You are the receptionist'));
    
    if (insertIndex === -1) {
      console.log(`⚠ ${templateFile} - could not find insertion point, adding to end`);
      data.system_prompt += SPEECH_PATTERNS;
    } else {
      lines.splice(insertIndex, 0, SPEECH_PATTERNS.trim());
      data.system_prompt = lines.join('\n');
    }
    
    // Write back with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ ${templateFile} - updated`);
    
  } catch (error) {
    console.error(`✗ ${templateFile} - error: ${error.message}`);
  }
}

console.log('\nDone!');
