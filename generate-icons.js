const fs = require('fs');
const { createCanvas } = require('canvas');

// Function to draw crown (similar to Lucide crown)
function drawCrown(ctx, size, centerX, centerY) {
    const scale = size / 100;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    
    // Crown color (golden yellow)
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Draw crown shape
    ctx.beginPath();
    
    // Base
    ctx.moveTo(-35, 15);
    ctx.lineTo(-35, 25);
    ctx.lineTo(35, 25);
    ctx.lineTo(35, 15);
    
    // Left spike
    ctx.lineTo(25, 0);
    ctx.lineTo(25, -25);
    ctx.lineTo(15, -15);
    
    // Center spike
    ctx.lineTo(0, -5);
    ctx.lineTo(0, -30);
    ctx.lineTo(-10, -20);
    
    // Right spike
    ctx.lineTo(-25, -15);
    ctx.lineTo(-25, -25);
    ctx.lineTo(-35, 0);
    
    ctx.closePath();
    ctx.fill();
    
    // Add shine
    const gradient = ctx.createLinearGradient(-35, -30, 35, 25);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Jewels
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(-15, -8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(15, -8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function createIcon(size, outputPath) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Purple gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(1, '#6d28d9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 50; i++) {
        ctx.fillRect(
            Math.random() * size,
            Math.random() * size,
            Math.random() * 3,
            Math.random() * 3
        );
    }
    
    // Draw crown
    drawCrown(ctx, size * 0.5, size / 2, size / 2);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.08}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ROYAL', size / 2, size * 0.75);
    
    ctx.font = `${size * 0.06}px Arial`;
    ctx.fillText('POKER', size / 2, size * 0.82);
    
    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Created: ${outputPath}`);
}

// Generate both sizes
try {
    createIcon(192, './public/poker-icon-192.png');
    createIcon(512, './public/poker-icon-512.png');
    console.log('✓ Icons generated successfully!');
} catch (error) {
    console.error('Error generating icons:', error.message);
    console.log('\nNote: If you see "Cannot find module \'canvas\'", run: npm install canvas');
}
