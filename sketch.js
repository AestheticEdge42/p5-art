// Gen Brush Art 設定
let imgNames = [
  '1.png',
  '2.png',
  '3.png',
  '4.png',
];
let imgIndex = 0;
let img;
let imgLoaded = false;
let strokesPerFrame = 500;
let hueBase = 0; // 基準となる色相
let hueRange = 30; // 同系統の色相の範囲
let logo; // ロゴ画像
let aspectRatio; // 画像のアスペクト比
let filterApplied = false; // フィルター描画フラグ
let filterHeight; // フィルターの高さ
let logoWidth, logoHeight; // ロゴサイズ
let logoMarginX, logoMarginY; // ロゴの余白

// マウスの動き計算用
let prevMouseX = 0;
let prevMouseY = 0;
let mouseSpeed = 0;
let prevAngle = 0; // 前回の角度を保持

// フォント設定
let font;

// ドットマトリックススクロールテキスト設定
let topScrollingText;
let bottomScrollingText;
let topTextColor = [255, 155, 205];
let bottomTextColor = [255, 155, 205];
let textSizeTop = 48;
let textSizeBottom = 40;
let topAreaHeight = 60;
let bottomAreaHeight = 60;

// レイヤー
let brushLayer;

// ノイズ用変数
let noiseSeedVal = 0;
let backgroundHueOffset = 0; // 背景色相変化用
let textNoiseOffsetTop = 0;
let textNoiseOffsetBottom = 1000; // 上下のテキストに異なる位相

// スクロールテキストクラス（改良版）
class ScrollingText {
  constructor(text, y, speed, color, size) {
    this.text = text;
    this.baseY = y; 
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.size = size;
    this.points = font.textToPoints(this.text, 0, 0, this.size, {
      sampleFactor: 0.7,
      simplifyThreshold: 0
    });
    this.textWidthValue = this.getTextWidth();
    this.x = 0;
    this.gap = 200;

    this.dots = this.points.map(p => ({
      x: p.x,
      y: p.y,
      on: true
    }));
  }

  getTextWidth() {
    let bounds = font.textBounds(this.text, 0, 0, this.size);
    return bounds.w;
  }

  update(noiseOffset) {
    this.x -= this.speed;
    if (this.x < -(this.textWidthValue + this.gap)) {
      this.x = 0;
    }

    this.y = this.baseY + map(noise(noiseOffset), 0, 1, -3, 3);

    this.dots.forEach(dot => {
      if (random(1) < 0.02) {
        dot.on = !dot.on;
      }
    });
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(this.color);
    noStroke();
    for (let dot of this.dots) {
      if (dot.on) ellipse(dot.x, dot.y, 3, 3);
    }
    pop();

    push();
    translate(this.x + this.textWidthValue + this.gap, this.y);
    fill(this.color);
    noStroke();
    for (let dot of this.dots) {
      if (dot.on) ellipse(dot.x, dot.y, 3, 3);
    }
    pop();
  }
}

// スライダー
let saturationSlider;
let brightnessSlider;

function preload() {
  img = loadImage(imgNames[imgIndex], () => {
    imgLoaded = true;
    aspectRatio = img.width / img.height;
  }, () => {
    console.error('Failed to load the image.');
  });

  logo = loadImage('Marelli_logo_BW_NEG_low.png');
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf');
}

function setup() {
  createCanvas(windowWidth, windowWidth / (img ? img.width / img.height : 1));
  colorMode(HSB, 255);
  textAlign(CENTER, CENTER);
  textFont(font);

  brushLayer = createGraphics(width, height);
  brushLayer.colorMode(HSB, 255);
  brushLayer.clear();

  if (img) {
    img.loadPixels();
  }

  calculateResponsiveSizes();

  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", topAreaHeight / 2 + textSizeTop / 3, 2, color(topTextColor), textSizeTop);
  bottomScrollingText = new ScrollingText("Find your core, Aim for more", height - bottomAreaHeight / 2 - textSizeBottom / -3.5, 2, color(bottomTextColor), textSizeBottom);

  noiseSeed(99);

  createP('Brush Saturation Adjustment').style('color', 'gray').style('font-size', '20px').position(100, height + 30);
  saturationSlider = createSlider(0, 2, 1, 0.01).position(100, height + 20).style('width', '300px');

  createP('Brush Brightness Adjustment').style('color', 'gray').style('font-size', '20px').position(100, height + 120);
  brightnessSlider = createSlider(0, 2, 1, 0.01).position(100, height + 100).style('width', '300px');

  background(0);
}

function draw() {
  if (!imgLoaded) {
    background(0);
    return;
  }

  backgroundHueOffset = (backgroundHueOffset + 0.1) % 255;
  drawBackgroundGradient();

  drawBrushArt();

  image(brushLayer, 0, 0, width, height);

  noStroke();
  fill(0);
  rect(0, 0, width, topAreaHeight);

  textNoiseOffsetTop += 0.01;
  textNoiseOffsetBottom += 0.01;
  topScrollingText.update(textNoiseOffsetTop);
  topScrollingText.display();

  noStroke();
  fill(0);
  rect(0, height - bottomAreaHeight, width, bottomAreaHeight);

  bottomScrollingText.update(textNoiseOffsetBottom);
  bottomScrollingText.display();

  if (!filterApplied) {
    drawFilter();
    filterApplied = true;
  }

  drawLogo();
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
  let brushSaturationMultiplier = saturationSlider.value();
  let brushBrightnessMultiplier = brightnessSlider.value();

  mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  if (mouseSpeed > 0) {
    prevAngle = atan2(mouseY - prevMouseY, mouseX - prevMouseX);
    hueBase = (hueBase + mouseSpeed * 0.5) % 255;
  }

  let noiseScale = 0.001;
  for (let i = 0; i < strokesPerFrame; i++) {
    let nx = random(width);
    let ny = random(height);
    let nVal = noise(nx * noiseScale, ny * noiseScale, frameCount * 0.0005);
    if (nVal < 0.3) continue;

    let x = int(map(nx, 0, width, 0, img.width));
    let y = int(map(ny, 0, height, 0, img.height));

    let index = (x + y * img.width) * 4;
    let r = img.pixels[index];
    let g = img.pixels[index + 1];
    let b = img.pixels[index + 2];
    let a = img.pixels[index + 3];

    // アルファチェック：透過部分は描かない
    if (a < 10) continue;

    let col = color(r, g, b);
    let br = brightness(col);
    let s = saturation(col);

    let strokeColor;

    if (imgIndex === 1 || imgIndex === 2) {
      // 2枚目と3枚目は白をきれいに見せたい
      // 明度が高い部分を白で描く
      // 例: br > 220で白
      if (br > 220) {
        strokeColor = color(0, 0, 255); // HSBで白
      } else {
        // 明度が低い部分はその明度に応じたグレーで描く
        // HSBでH=0, S=0, B=brでグレー
        strokeColor = color(0, 0, br);
      }
    } else {
      // その他の画像は以前のロジック
      if (br < 50) {
        strokeColor = color(0, 0, 0);
      } else if (br > 220) {
        continue;
      } else {
        let h = (hueBase + random(-hueRange, hueRange)) % 255;
        if (h < 0) h += 255;
        let adjustedSaturation = constrain(s * brushSaturationMultiplier, 0, 255);
        let adjustedBrightness = constrain(br * brushBrightnessMultiplier, 0, 255);
        strokeColor = color(h, adjustedSaturation, adjustedBrightness);
      }
    }

    brushLayer.push();
    brushLayer.translate(nx, ny);
    brushLayer.rotate(prevAngle);
    let strokeLength = map(mouseSpeed, 0, 50, 10, 50);

    let strokeType = int(random(3));
    if (strokeType === 0) {
      brushFineStroke(strokeColor, strokeLength);
    } else if (strokeType === 1) {
      brushMediumStroke(strokeColor, strokeLength);
    } else {
      brushLargeStroke(strokeColor, strokeLength);
    }
    brushLayer.pop();
  }

  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function drawFilter() {
  let filterBuffer = createGraphics(width, height);
  filterBuffer.clear();
  for (let y = height - filterHeight; y < height; y++) {
    let alpha = map(y, height - filterHeight, height, 0, 55);
    filterBuffer.noStroke();
    filterBuffer.fill(0, alpha);
    filterBuffer.rect(0, y, width, 1);
  }
  image(filterBuffer, 0, 0);
}

function drawLogo() {
  let xPosition = width - logoWidth - logoMarginX;
  let yPosition = height - logoHeight - logoMarginY;
  image(logo, xPosition, yPosition, logoWidth, logoHeight);
}

function calculateResponsiveSizes() {
  filterHeight = height * 0.6;
  logoWidth = width * 0.08;
  logoHeight = logoWidth * (logo.height / logo.width);
  logoMarginX = width * 0.05;
  logoMarginY = height * 0.15;
}


function brushFineStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.0001, 0.0001));
  brushLayer.beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = random(TWO_PI);
    let radius = random(strokeLength * 0.001, strokeLength * 0.003);
    brushLayer.vertex(cos(angle) * radius, sin(angle) * radius);
  }
  brushLayer.endShape(CLOSE);
}

function brushMediumStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.01, 0.09));
  for (let i = 0; i < 5; i++) {
    let offset = random(-strokeLength / 4, strokeLength / 4);
    brushLayer.line(-strokeLength / 2 + offset, offset, strokeLength / 52 + offset, offset);
  }
}

function brushLargeStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.05, 0.05));
  brushLayer.noStroke();
  brushLayer.fill(strokeColor, random(100, 150));
  brushLayer.ellipse(0, 0, strokeLength * 0.01, strokeLength * 0.01);
  brushLayer.strokeWeight(random(0.05, 0.05));
  brushLayer.line(-strokeLength / 0.01, 0, strokeLength / 0.01, 0);
}

function mousePressed() {
  imgIndex = (imgIndex + 1) % imgNames.length;
  imgLoaded = false;

  loadImage(imgNames[imgIndex], (newImg) => {
    img = newImg;
    img.loadPixels();
    imgLoaded = true;

    let oldBrush = brushLayer.get();
    resizeCanvas(windowWidth, windowWidth / aspectRatio);
    brushLayer.resizeCanvas(width, height);
    brushLayer.image(oldBrush, 0, 0, width, height);

    calculateResponsiveSizes();
    filterApplied = false;

    topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", topAreaHeight / 2 + topScrollingText.size / 3, 2, color(topTextColor), textSizeTop);
    bottomScrollingText = new ScrollingText("Find your core, Aim for more", height - bottomAreaHeight / 2 - bottomScrollingText.size / -3.5, 2, color(bottomTextColor), textSizeBottom);
  }, () => {
    console.error('Failed to load the next image.');
  });
}

function windowResized() {
  let oldBrush = brushLayer.get();
  resizeCanvas(windowWidth, windowWidth / (img ? img.width / img.height : 1));
  brushLayer.resizeCanvas(width, height);
  brushLayer.image(oldBrush, 0, 0, width, height);

  calculateResponsiveSizes();
  filterApplied = false;

  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", topAreaHeight / 2 + topScrollingText.size / 3, 2, color(topTextColor), textSizeTop);
  bottomScrollingText = new ScrollingText("Find your core, Aim for more", height - bottomAreaHeight / 2 - bottomScrollingText.size / -3.5, 2, color(bottomTextColor), textSizeBottom);
}

// カスタマイズ用関数
function setTopTextColor(r, g, b) {
  topTextColor = [r, g, b];
  topScrollingText.color = color(r, g, b);
}

function setBottomTextColor(r, g, b) {
  bottomTextColor = [r, g, b];
  bottomScrollingText.color = color(r, g, b);
}

function setTopAreaHeight(newHeight) {
  topAreaHeight = newHeight;
  topScrollingText.baseY = topAreaHeight / 2 + topScrollingText.size / 3;
}

function setBottomAreaHeight(newHeight) {
  bottomAreaHeight = newHeight;
  bottomScrollingText.baseY = height - bottomAreaHeight / 2 - bottomScrollingText.size / -3.5;
}
