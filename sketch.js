// グローバル変数の宣言
let imgNames = [
  'assets/images/11.png',
  'assets/images/22.png',
  'assets/images/3.png',
  'assets/images/4.png',
];

let imgIndex = 0;
let img;
let imgLoaded = false;
let strokesPerFrame = 500; 
let hueBase = 0;
let hueRange = 30;
let logo;
let aspectRatio = 16 / 9; 
let filterApplied = false;
let filterHeight;
let logoWidth, logoHeight;
let logoMarginX, logoMarginY;

let prevMouseX = 0;
let prevMouseY = 0;
let mouseSpeed = 0;
let prevAngle = 0;

let font;

let topScrollingText;
let bottomScrollingText;
let topTextColor = [255, 155, 205];
let bottomTextColor = [255, 155, 205];
let textSizeTop;    
let textSizeBottom; 
let topAreaHeight = 60;   
let bottomAreaHeight = 60;

let textSizeTopRatio = 0.6;   
let textSizeBottomRatio = 0.5;

let brushLayer;

let noiseSeedVal = 0;
let backgroundHueOffset = 0;
let textNoiseOffsetTop = 0;
let textNoiseOffsetBottom = 1000;

let layerSaturationScale = [5.5, 3.0, 6.0, 4.0];
let layerBrightnessScale = [1.8, 1.2, 1.0, 1.5];

let layerFrameCount = 0;
let maxLayerFrames = 700; 

let layerInfoWidth = 300;
let layerInfoHeight = 160; // Instructionボタン分追加
let layerInfoX = 40;
let layerInfoY = 50;
let progressBarWidth = 200;
let progressBarHeight = 20;

let blueColorForLayer3 = [150, 155, 255];

let state = "intro";

let introText = 
`Welcome to the Interactive Brush Art.
Enjoy watching the creation of Brush Art!
******************************************************************************
- Move your mouse and notice how colors, brush directions, and sizes evolve.
- When the progress bar is full, click to move on to the next layer.
- There are 4 layers total, and once all are revealed,
you'll see the final masterpiece come to life.
******************************************************************************
To start the art, please click anywhere on the screen.`;

let rainbowMessage = "To start the art, please click anywhere on the screen.";

let instructionsHeightFactor = 0.25;
let instructionsBaseTextSizeFactor = 0.024;
let instructionsY;
let instructionsHeight;
let introTextSize;
let rainbowHue = 0;
let overlayAlpha = 255;
let instructionScale = 1;

let nextLayerMessage = "Click to move on \nto the next art layer.";

let marginX, marginY;
let artWidth, artHeight;
let artOriginX, artOriginY;
let brushScale;

let showInstructions = true; 
let instructionButtonX, instructionButtonY, instructionButtonW, instructionButtonH;

let savingImage = false; // SキーでUIなし画像保存フラグ

class ScrollingText {
  constructor(text, y, speed, colorVal, size, reverseScroll = false) {
    this.text = text;
    this.baseY = y;
    this.y = y;
    this.speed = speed;
    this.colorVal = colorVal;
    this.size = size;
    this.reverseScroll = reverseScroll;
    this.points = font.textToPoints(this.text, 0, 0, this.size, { sampleFactor: 0.7, simplifyThreshold: 0 });
    this.textWidthValue = this.getTextWidth();
    this.x = 0;
    this.gap = 200;
    this.dots = this.points.map(p => ({ x: p.x, y: p.y, on: true }));
  }

  getTextWidth() {
    let bounds = font.textBounds(this.text, 0, 0, this.size);
    return bounds.w;
  }

  update(noiseOffset) {
    if (this.reverseScroll) {
      this.x += this.speed;
      if (this.x > (this.textWidthValue + this.gap)) this.x = 0;
    } else {
      this.x -= this.speed;
      if (this.x < -(this.textWidthValue + this.gap)) this.x = 0;
    }
    this.y = this.baseY + map(noise(noiseOffset), 0, 1, -3, 3);
    this.dots.forEach(dot => { if (random(1) < 0.02) dot.on = !dot.on; });
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(this.colorVal);
    noStroke();
    for (let dot of this.dots) if (dot.on) ellipse(dot.x, dot.y, 3, 3);
    pop();

    push();
    translate(this.x + (this.reverseScroll ? -(this.textWidthValue + this.gap) : (this.textWidthValue + this.gap)), this.y);
    fill(this.colorVal);
    noStroke();
    for (let dot of this.dots) if (dot.on) ellipse(dot.x, dot.y, 3, 3);
    pop();
  }
}

function preload() {
  img = loadImage(imgNames[imgIndex], () => {
    imgLoaded = true;
    aspectRatio = img.width / img.height;
  }, () => { console.error('Failed to load the image.'); });

  logo = loadImage('assets/images/Marelli_logo_BW_NEG_low.png', () => {}, () => {
    console.error('Failed to load the logo image.');
  });

  font = loadFont('assets/fonts/SourceCodePro-Regular.otf', 
    () => { console.log('Font loaded successfully.'); },
    () => { console.error('Failed to load the font.'); }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 255);
  textFont(font);
  frameRate(30);
  calculateResponsiveSizes();

  brushLayer = createGraphics(artWidth, artHeight);
  brushLayer.colorMode(HSB, 255);
  brushLayer.clear();
  if (imgLoaded) img.loadPixels();

  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                       artOriginY - topAreaHeight + topAreaHeight/2 + textSizeTop/3, 
                                       2, color(topTextColor), textSizeTop, false);

  bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                          artOriginY + artHeight + bottomAreaHeight/2 + textSizeBottom/3.5, 
                                          2, color(bottomTextColor), textSizeBottom, true);

  setupInstructions();
}

function calculateResponsiveSizes() {
  marginX = width * 0.05;
  marginY = height * 0.1;

  let tempArtWidth = width - 2 * marginX;
  let tempArtHeight = tempArtWidth / aspectRatio;

  if (tempArtHeight > height - 2 * marginY) {
    artHeight = height - 2 * marginY;
    artWidth = artHeight * aspectRatio;
  } else {
    artWidth = tempArtWidth;
    artHeight = tempArtHeight;
  }

  artOriginX = (width - artWidth) / 2;
  artOriginY = (height - artHeight) / 2;
  brushScale = min(artWidth, artHeight) / 1000;

  textSizeTop = topAreaHeight * textSizeTopRatio;
  textSizeBottom = bottomAreaHeight * textSizeBottomRatio;

  logoWidth = artWidth * 0.08; 
  if (logo && logo.width !== 0 && logo.height !== 0) {
    logoHeight = logo.height * (logoWidth / logo.width);
  } else {
    logoHeight = logoWidth;
  }
  logoMarginX = artWidth * 0.05; 
  logoMarginY = artHeight * 0.05; 

  layerInfoX = artOriginX + 20; 
  layerInfoY = artOriginY + 20;

  progressBarWidth = artWidth * 0.1; 
  progressBarHeight = artHeight * 0.02;

  instructionButtonW = 100;
  instructionButtonH = 30;
  instructionButtonX = layerInfoX + (layerInfoWidth - instructionButtonW)/2;
  instructionButtonY = layerInfoY + layerInfoHeight - instructionButtonH - 10; 
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateResponsiveSizes();

  if (brushLayer) {
    let oldBrush = brushLayer.get();
    brushLayer.resizeCanvas(artWidth, artHeight);
    brushLayer.image(oldBrush, 0, 0, artWidth, artHeight);
  }

  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                       artOriginY - topAreaHeight + topAreaHeight/2 + textSizeTop/3, 
                                       2, color(topTextColor), textSizeTop, false);

  bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                          artOriginY + artHeight + bottomAreaHeight/2 + textSizeBottom/3.5, 
                                          2, color(bottomTextColor), textSizeBottom, true);

  setupInstructions();
}

function setupInstructions() {
  let dim = min(width, height);
  introTextSize = dim * instructionsBaseTextSizeFactor * instructionScale; 
  instructionsHeight = height * instructionsHeightFactor;
  if (state === "intro") instructionsY = (height - instructionsHeight) / 2;
}

function draw() {
  background(0);

  if (imgLoaded) {
    backgroundHueOffset = (backgroundHueOffset + 0.1) % 255;
    drawBackgroundGradient();
    drawBrushArt();
    image(brushLayer, artOriginX, artOriginY, artWidth, artHeight);

    noStroke();
    fill(0);
    rect(artOriginX, artOriginY - topAreaHeight, artWidth, topAreaHeight);

    textNoiseOffsetTop += 0.01;
    textNoiseOffsetBottom += 0.01;

    push();
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(artOriginX, artOriginY - topAreaHeight, artWidth, topAreaHeight);
    ctx.clip();
    topScrollingText.update(textNoiseOffsetTop);
    topScrollingText.display();
    ctx.restore();
    pop();

    noStroke();
    fill(0);
    rect(artOriginX, artOriginY + artHeight, artWidth, bottomAreaHeight);
    bottomScrollingText.baseY = artOriginY + artHeight + bottomAreaHeight / 2 + textSizeBottom / 3.5;
    bottomScrollingText.y = bottomScrollingText.baseY;
    push();
    ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(artOriginX, artOriginY + artHeight, artWidth, bottomAreaHeight);
    ctx.clip();
    bottomScrollingText.update(textNoiseOffsetBottom);
    bottomScrollingText.display();
    ctx.restore();
    pop();

    if (!filterApplied) {
      drawFilterOverArt(artHeight);
      filterApplied = true;
    }

    drawLogoOnArt(artHeight);
  }

  if (state === "transition") {
    overlayAlpha = lerp(overlayAlpha, 0, 0.05);
    if (overlayAlpha < 1) {
      overlayAlpha = 0;
      state = "art";
      showInstructions = false; 
    }
  }

  if (!savingImage) {
    if ((state === "intro" || state === "transition") && overlayAlpha > 0) {
      push();
      noStroke();
      fill(0, overlayAlpha);
      rect(0, 0, width, height);
      displayInstructions();
      pop();
    } else if (state === "art" && showInstructions) {
      push();
      fill(0, 200);
      noStroke();
      rect(0, instructionsY, width, instructionsHeight);
      pop();
      displayInstructions();
    }

    if (state === "art") {
      displayLayerInfo();
    }
  }

  // art状態でlayerFrameCountを増やしプログレスバーが伸びるようにする
  if (state === "art") {
    layerFrameCount++;
  }
}

function displayInstructions() {
  push();
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(introTextSize);
  textLeading(introTextSize * 1.5);

  let displayText = introText;
  if (state === 'art') {
    let lines = displayText.split('\n').filter(line => line !== rainbowMessage);
    displayText = lines.join('\n');
  }

  let lines = displayText.split('\n');
  text(lines.join('\n'), width / 2, instructionsY + instructionsHeight / 2);

  if (state !== 'art') {
    let rainbowLineIndex = lines.indexOf(rainbowMessage);
    if (rainbowLineIndex >= 0) {
      rainbowHue = (rainbowHue + 4) % 255;
      fill(rainbowHue, 155, 255);
      let lineHeight = introTextSize * 1.5;
      let textBlockY = instructionsY + instructionsHeight / 2;
      let rainbowY = textBlockY - (lineHeight * (lines.length / 2 - rainbowLineIndex - 0.5));
      text(lines[rainbowLineIndex], width / 2, rainbowY);
    }
  }
  pop();
}

function drawBackgroundGradient() {
  for (let y = 0; y < height; y++) {
    let inter = y / height;
    let h = (backgroundHueOffset + inter * 10) % 255;
    let s = 80;
    let b = map(inter, 0, 1, 180, 80);
    stroke(h, s, b);
    line(0, y, width, y);
  }
}

function drawBrushArt() {
  mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  if (mouseSpeed > 0) {
    prevAngle = atan2(mouseY - prevMouseY, mouseX - prevMouseX);
    hueBase = (hueBase + mouseSpeed * 0.5) % 255;
  }

  let noiseScale = 0.001;

  for (let i = 0; i < strokesPerFrame; i++) {
    let nx = random(brushLayer.width);
    let ny = random(brushLayer.height);
    let nVal = noise(nx * noiseScale, ny * noiseScale, frameCount * 0.0005);
    if (nVal < 0.3) continue;

    let x = int(map(nx, 0, brushLayer.width, 0, img.width));
    let y = int(map(ny, 0, brushLayer.height, 0, img.height));

    let index = (x + y * img.width) * 4;
    let r = img.pixels[index];
    let g = img.pixels[index + 1];
    let b = img.pixels[index + 2]; 
    let a = img.pixels[index + 3];

    if (a < 10) continue;

    let col = color(r, g, b);
    let br = brightness(col);
    let s = saturation(col);
    s = min(s * layerSaturationScale[imgIndex], 255); 
    br = min(br * layerBrightnessScale[imgIndex], 255);

    let strokeColor;
    if (imgIndex === 0) {
      if (br > 254) strokeColor = color(0,0,255);
      else if (br < 150) strokeColor = color(0,0,0);
      else {
        let h = (hueBase + random(-hueRange, hueRange)) % 255;
        if (h < 0) h += 255;
        strokeColor = color(h, s, br);
      }
    } else if (imgIndex === 1) {
      strokeColor = (br > 128) ? color(0,0,255) : color(0,0,0);
    } else if (imgIndex === 2) {
      strokeColor = (br > 128) ? color(0,0,255) : color(blueColorForLayer3[0], blueColorForLayer3[1], blueColorForLayer3[2]);
    } else {
      if (br < 50) strokeColor = color(0,0,0);
      else if (br > 220) continue;
      else {
        let h = (hueBase + random(-hueRange, hueRange)) % 255;
        if (h < 0) h += 255;
        strokeColor = color(h, s, br);
      }
    }

    brushLayer.push();
    brushLayer.translate(nx, ny);
    brushLayer.rotate(prevAngle);
    let strokeLength = map(mouseSpeed, 0, 50, 10, 50) * brushScale;
    let strokeType = int(random(3));
    if (strokeType === 0) brushFineStroke(strokeColor, strokeLength);
    else if (strokeType === 1) brushMediumStroke(strokeColor, strokeLength);
    else brushLargeStroke(strokeColor, strokeLength);
    brushLayer.pop();
  }

  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function drawFilterOverArt(artHeight) {
  let filterBuffer = createGraphics(artWidth, artHeight);
  filterBuffer.clear();
  if (!filterHeight) filterHeight = artHeight * 0.1;
  for (let y = artHeight - filterHeight; y < artHeight; y++) {
    let alpha = map(y, artHeight - filterHeight, artHeight, 0, 55);
    filterBuffer.noStroke();
    filterBuffer.fill(0, alpha);
    filterBuffer.rect(0, y, artWidth, 1);
  }
  image(filterBuffer, artOriginX, artOriginY);
}

function drawLogoOnArt(artHeight) {
  if (logo && logo.width !== 0 && logo.height !== 0) {
    let xPosition = artOriginX + artWidth - logoWidth - logoMarginX;
    let yPosition = artOriginY + artHeight - logoHeight - logoMarginY;
    image(logo, xPosition, yPosition, logoWidth, logoHeight);
  }
}

function displayLayerInfo() {
  push();
  noStroke();
  fill(0, 180); 
  rect(layerInfoX, layerInfoY, layerInfoWidth, layerInfoHeight, 10);
  pop();

  let centerX = layerInfoX + layerInfoWidth / 2;

  push();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  let layerInfoText = `Layer: ${imgIndex + 1}/${imgNames.length}`;
  text(layerInfoText, centerX, layerInfoY + 30);
  pop();

  let progress = (layerFrameCount / maxLayerFrames) * 100;
  progress = constrain(progress, 0, 100);

  let barX = centerX - progressBarWidth / 2;
  let barY = layerInfoY + 60; 
  push();
  // 背景
  fill(255, 50);
  rect(barX, barY, progressBarWidth, progressBarHeight, 5);
  // 伸びる部分(明るい緑)
  fill(120,255,255); // HSBで明るい緑
  let barW = map(progress, 0, 100, 0, progressBarWidth);
  if (barW > 0) {
    rect(barX, barY, barW, progressBarHeight, 5);
  }
  pop();

  push();
  textAlign(CENTER, CENTER);
  textSize(15);
  let messageY = barY + 40;
  if (progress >= 100) {
    rainbowHue = (rainbowHue + 4) % 255;
    fill(rainbowHue, 155, 255);
    text(nextLayerMessage, centerX, messageY);
  } else {
    fill(255);
    text("Now loading", centerX, messageY);
  }
  pop();

  push();
  textAlign(CENTER, CENTER);
  textSize(15);
  fill(0, 100);
  rect(instructionButtonX, instructionButtonY, instructionButtonW, instructionButtonH, 5);
  fill(255);
  text("Instruction", instructionButtonX + instructionButtonW/2, instructionButtonY + instructionButtonH/2);
  pop();
}

function brushFineStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.0025, 0.005) * brushScale);
  brushLayer.beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = random(TWO_PI);
    let radius = random(strokeLength * 0.001, strokeLength * 0.003) * brushScale;
    brushLayer.vertex(cos(angle) * radius, sin(angle) * radius);
  }
  brushLayer.endShape(CLOSE);
}

function brushMediumStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.01, 0.05) * brushScale);
  for (let i = 0; i < 5; i++) {
    let offset = random(-strokeLength / 4, strokeLength / 4) * brushScale;
    brushLayer.line(-strokeLength / 5 * brushScale + offset, offset, strokeLength / 5 * brushScale + offset, offset);
  }
}

function brushLargeStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.05, 0.5) * brushScale);
  brushLayer.noFill();
  brushLayer.ellipse(0, 0, strokeLength * 0.02 * brushScale, strokeLength * 0.02 * brushScale);
  brushLayer.line(-strokeLength / 10 * brushScale, 0, strokeLength / 10 * brushScale, 0);
}

function mousePressed() {
  if (state === "intro") {
    state = "transition";
    return;
  }

  if (state === "art") {
    // Instructionボタンクリック判定
    if (mouseX >= instructionButtonX && mouseX <= instructionButtonX + instructionButtonW &&
        mouseY >= instructionButtonY && mouseY <= instructionButtonY + instructionButtonH) {
      showInstructions = !showInstructions;
      return;
    }

    // 次のレイヤーへ
    imgIndex = (imgIndex + 1) % imgNames.length;
    imgLoaded = false;

    loadImage(imgNames[imgIndex], (newImg) => {
      img = newImg;
      img.loadPixels();
      imgLoaded = true;

      let oldBrush = brushLayer.get();
      brushLayer.resizeCanvas(artWidth, artHeight);
      brushLayer.image(oldBrush, 0, 0, artWidth, artHeight);

      calculateResponsiveSizes();
      filterApplied = false;

      topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                           artOriginY - topAreaHeight + topAreaHeight/2 + textSizeTop/3, 
                                           2, color(topTextColor), textSizeTop, false);

      bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                              artOriginY + artHeight + bottomAreaHeight/2 + textSizeBottom/3.5, 
                                              2, color(bottomTextColor), textSizeBottom, true);

      layerFrameCount = 0;
    }, () => { console.error('Failed to load the next image.'); });
  }
}

function keyPressed() {
  if (key === 'S' || key === 's') {
    savingImage = true;
    noLoop();
    redraw();  
    saveCanvas('myArt', 'png');
    savingImage = false;
    loop();
  }
}
