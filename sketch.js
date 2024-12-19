e// グローバル変数の宣言
let imgNames = [
  'assets/images/11.png',
  'assets/images/22.png',
  'assets/images/3.png',
  'assets/images/4.png',
];

let imgIndex = 0;
let img;
let imgLoaded = false;
let strokesPerFrame = 500; // パフォーマンス向上のため減少
let hueBase = 0;
let hueRange = 30;
let logo;
let aspectRatio = 16 / 9; // デフォルトのアスペクト比
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
let textSizeTop;    // 後で計算
let textSizeBottom; // 後で計算
let topAreaHeight = 60;    // 黒帯の高さ
let bottomAreaHeight = 60; // 黒帯の高さ

// デザイン的バランスを取るためのテキストサイズ比率
let textSizeTopRatio = 0.6;    // topAreaHeightに対する比率
let textSizeBottomRatio = 0.5; // bottomAreaHeightに対する比率

let brushLayer;

let noiseSeedVal = 0;
let backgroundHueOffset = 0;
let textNoiseOffsetTop = 0;
let textNoiseOffsetBottom = 1000;

let layerSaturationScale = [5.5, 3.0, 6.0, 4.0];
let layerBrightnessScale = [1.8, 1.2, 1.0, 1.5];

let layerFrameCount = 0;
let maxLayerFrames = 700; // 元は2000

let layerInfoX = 40;
let layerInfoY = 50;
let progressBarX = 50;
let progressBarY = 120;
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

let instructionsTargetY;
let overlayAlpha = 255;
let instructionScale = 1;

let nextLayerMessage = "Click to move on \nto the next art layer.";

// アート領域とマージンの設定
let marginX, marginY;
let artWidth, artHeight;
let artOriginX, artOriginY;
let brushScale;

// スクロールテキストを管理するクラス
class ScrollingText {
  constructor(text, y, speed, color, size, reverseScroll = false) {
    this.text = text;
    this.baseY = y;
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.size = size;
    this.reverseScroll = reverseScroll;

    // テキストを点に変換
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
    if (this.reverseScroll) {
      this.x += this.speed;
      if (this.x > (this.textWidthValue + this.gap)) {
        this.x = 0;
      }
    } else {
      this.x -= this.speed;
      if (this.x < -(this.textWidthValue + this.gap)) {
        this.x = 0;
      }
    }

    // ノイズでY位置を微調整
    this.y = this.baseY + map(noise(noiseOffset), 0, 1, -3, 3);

    // 点の点滅をランダムに制御
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
    translate(this.x + (this.reverseScroll ? -(this.textWidthValue + this.gap) : (this.textWidthValue + this.gap)), this.y);
    fill(this.color);
    noStroke();
    for (let dot of this.dots) {
      if (dot.on) ellipse(dot.x, dot.y, 3, 3);
    }
    pop();
  }
}

function preload() {
  // 画像の読み込み
  img = loadImage(imgNames[imgIndex], () => {
    imgLoaded = true;
    aspectRatio = img.width / img.height;
  }, () => {
    console.error('Failed to load the image.');
  });

  // ロゴ画像の読み込み
  logo = loadImage('assets/images/Marelli_logo_BW_NEG_low.png', () => {
    // ロゴの幅と高さは後で設定
  }, () => {
    console.error('Failed to load the logo image.');
  });

  // フォントの読み込み
  font = loadFont('assets/fonts/SourceCodePro-Regular.otf', 
    () => { 
      console.log('Font loaded successfully.');
    },
    () => {
      console.error('Failed to load the font.');
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 255);
  textFont(font);

  calculateResponsiveSizes();

  // ブラシレイヤーをアート領域のサイズで作成
  brushLayer = createGraphics(artWidth, artHeight);
  brushLayer.colorMode(HSB, 255);
  brushLayer.clear();

  if (imgLoaded) {
    img.loadPixels();
  }

  // スクロールテキストオブジェクトの作成(座標は後で更新)
  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                       artOriginY - topAreaHeight + topAreaHeight/2 + textSizeTop/3, 
                                       2, 
                                       color(topTextColor), 
                                       textSizeTop, 
                                       false);

  bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                          artOriginY + artHeight + bottomAreaHeight/2 + textSizeBottom/3.5, 
                                          2, 
                                          color(bottomTextColor), 
                                          textSizeBottom, 
                                          true);

  // ノイズシードの設定
  noiseSeed(noiseSeedVal);
  background(0);

  // インストラクションの設定
  setupInstructions();
}

function calculateResponsiveSizes() {
  // マージンを5%に設定
  marginX = width * 0.05;
  marginY = height * 0.1;

  // 一時的なアート幅と高さを計算
  let tempArtWidth = width - 2 * marginX;
  let tempArtHeight = tempArtWidth / aspectRatio;

  // アート領域のサイズをウィンドウサイズに合わせて調整
  if (tempArtHeight > height - 2 * marginY) {
    artHeight = height - 2 * marginY;
    artWidth = artHeight * aspectRatio;
  } else {
    artWidth = tempArtWidth;
    artHeight = tempArtHeight;
  }

  // アート領域の開始位置（左上）
  artOriginX = (width - artWidth) / 2;
  artOriginY = (height - artHeight) / 2;

  // ブラシサイズのスケーリング
  brushScale = min(artWidth, artHeight) / 1000;

  // テキストサイズの調整(黒帯の高さに対する比率)
  textSizeTop = topAreaHeight * textSizeTopRatio;
  textSizeBottom = bottomAreaHeight * textSizeBottomRatio;

  // ロゴのサイズとマージンの計算
  logoWidth = artWidth * 0.08; // アート幅の8%
  if (logo && logo.width !== 0 && logo.height !== 0) {
    logoHeight = logo.height * (logoWidth / logo.width);
  } else {
    logoHeight = logoWidth; // デフォルト値
  }
  logoMarginX = artWidth * 0.05; // アート幅の5%
  logoMarginY = artHeight * 0.05; // アート高さの10%

  // レイヤー情報の位置をアート領域内に設定
  layerInfoX = artOriginX + 20; // アート開始位置から20px右
  layerInfoY = artOriginY + 20; // アート開始位置から20px下

  // プログレスバーの位置とサイズ
  progressBarX = layerInfoX + 30;
  progressBarY = layerInfoY + 40;
  progressBarWidth = artWidth * 0.1; 
  progressBarHeight = artHeight * 0.02;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateResponsiveSizes();

  // キャンバスサイズのリサイズ後、ブラシレイヤーをリサイズ
  if (brushLayer) {
    let oldBrush = brushLayer.get();
    brushLayer.resizeCanvas(artWidth, artHeight);
    brushLayer.image(oldBrush, 0, 0, artWidth, artHeight);
  } else {
    console.error('brushLayerが定義されていません。');
  }

  // スクロールテキストを再設定
  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                       artOriginY - topAreaHeight + topAreaHeight/2 + textSizeTop/3, 
                                       2, 
                                       color(topTextColor), 
                                       textSizeTop, 
                                       false);

  bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                          artOriginY + artHeight + bottomAreaHeight/2 + textSizeBottom/3.5, 
                                          2, 
                                          color(bottomTextColor), 
                                          textSizeBottom, 
                                          true);

  // インストラクションを再設定
  setupInstructions();
  if (state === "art") {
    instructionsY = instructionsTargetY; 
  }
}

function setupInstructions() {
  let dim = min(width, height);
  introTextSize = dim * instructionsBaseTextSizeFactor * instructionScale; 
  instructionsHeight = height * instructionsHeightFactor;

  if (state === "intro") {
    instructionsY = (height - instructionsHeight) / 2;
  }

  // インストラクションウィンドウをbottomScrollingTextより下に配置
  instructionsTargetY = artOriginY + artHeight + bottomAreaHeight + 20; 
}

function draw() {
  background(0);

  if (imgLoaded) {
    // 背景の色相オフセットを更新
    backgroundHueOffset = (backgroundHueOffset + 0.1) % 255;
    // 背景グラデーションを描画
    drawBackgroundGradient();
    // ブラシアートを描画
    drawBrushArt();
    // ブラシレイヤーをキャンバスに表示
    image(brushLayer, artOriginX, artOriginY, artWidth, artHeight);

    // 上部テキスト領域の黒背景
    noStroke();
    fill(0);
    rect(artOriginX, artOriginY - topAreaHeight, artWidth, topAreaHeight);

    textNoiseOffsetTop += 0.01;
    textNoiseOffsetBottom += 0.01;

    // 上部テキスト描画 (クリップ領域設定)
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

    // 下部テキスト領域の黒背景
    noStroke();
    fill(0);
    rect(artOriginX, artOriginY + artHeight, artWidth, bottomAreaHeight);

    // 下部スクロールテキスト再設定
    bottomScrollingText.baseY = artOriginY + artHeight + bottomAreaHeight / 2 + textSizeBottom / 3.5;
    bottomScrollingText.y = bottomScrollingText.baseY;

    // 下部テキスト描画 (クリップ領域設定)
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

    // フィルターが未適用なら適用
    if (!filterApplied) {
      drawFilterOverArt(artHeight);
      filterApplied = true;
    }

    // ロゴ描画
    drawLogoOnArt(artHeight);

    if (state === "art") displayLayerInfo();
  }

  // オーバーレイの描画
  if (overlayAlpha > 0) {
    push();
    noStroke();
    fill(0, overlayAlpha);
    rect(0, 0, width, height);
    pop();
  }

  // インストラクション描画
  displayInstructions();

  // 状態による処理
  if (state === "intro") {
    // イントロ時は待ち
  } else if (state === "transition") {
    instructionsY = lerp(instructionsY, instructionsTargetY, 0.05);
    overlayAlpha = lerp(overlayAlpha, 0, 0.05);
    instructionScale = lerp(instructionScale, 0.8, 0.05);

    setupInstructions();
    if (abs(instructionsY - instructionsTargetY) < 1 && overlayAlpha < 1) {
      instructionsY = instructionsTargetY;
      overlayAlpha = 0;
      instructionScale = 0.8;
      setupInstructions();
      state = "art";
    }
  } else if (state === "art") {
    layerFrameCount++;
  }
}

function displayInstructions() {
  push();
  textAlign(CENTER, CENTER);

  // インストラクション背景
  fill(0, 200);
  noStroke();
  rect(0, instructionsY, width, instructionsHeight);

  fill(255);
  textSize(introTextSize);
  textLeading(introTextSize * 1.5);

  let displayText = introText;
  if (state === 'art') {
    // アート状態では"To start the art..."行を削除
    let lines = displayText.split('\n').filter(line => line !== rainbowMessage);
    displayText = lines.join('\n');
  }

  let lines = displayText.split('\n');
  text(lines.join('\n'), width / 2, instructionsY + instructionsHeight / 2);

  // 虹色明滅ライン("To start the art...")はintro/transition時のみ表示
  if (state !== 'art') {
    let rainbowLineIndex = lines.indexOf(rainbowMessage);
    if (rainbowLineIndex >= 0) {
      // 虹色の明滅
      rainbowHue = (rainbowHue + 4) % 255;
      fill(rainbowHue, 155, 255);
      // 行のY計算
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
      if (br > 254) {
        strokeColor = color(100, 100, 255); // 白
      } else if (br < 150) {
        strokeColor = color(0, 0, 0); // 黒
      } else {
        let h = (hueBase + random(-hueRange, hueRange)) % 255;
        if (h < 0) h += 255;
        strokeColor = color(h, s, br);
      }
    } else if (imgIndex === 1) {
      if (br > 128) {
        strokeColor = color(0, 0, 255); // 白
      } else {
        strokeColor = color(0, 0, 0);   // 黒
      }
    } else if (imgIndex === 2) {
      if (br > 128) {
        strokeColor = color(0, 0, 255); // 白
      } else {
        strokeColor = color(blueColorForLayer3[0], blueColorForLayer3[1], blueColorForLayer3[2]); // 青
      }
    } else {
      if (br < 50) {
        strokeColor = color(0, 0, 0); // 黒
      } else if (br > 220) {
        continue;
      } else {
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

function drawFilterOverArt(artHeight) {
  let filterBuffer = createGraphics(artWidth, artHeight);
  filterBuffer.clear();
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
  rect(layerInfoX, layerInfoY, 300, 120, 10);
  pop();

  push();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(20);
  let layerInfo = `Layer: ${imgIndex + 1}/${imgNames.length}`;
  text(layerInfo, layerInfoX + 90, layerInfoY + 10);
  pop();

  let progress = (layerFrameCount / maxLayerFrames) * 100;
  progress = constrain(progress, 0, 100);

  push();
  fill(255, 50);
  rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5);

  fill(0, 255, 0);
  let barWidth = map(progress, 0, 100, 0, progressBarWidth);
  rect(progressBarX, progressBarY, barWidth, progressBarHeight, 5);
  pop();

  if (progress >= 100) {
    push();
    textAlign(CENTER, CENTER);
    textSize(15);
    rainbowHue = (rainbowHue + 4) % 255;
    fill(rainbowHue, 155, 255);
    text(nextLayerMessage, layerInfoX + 150, layerInfoY + 80);
    pop();
  } else {
    push();
    textAlign(CENTER, CENTER);
    textSize(15);
    fill(255);
    text("Now loading", layerInfoX + 150, layerInfoY + 80);
    pop();
  }
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
    brushLayer.line(-strokeLength / 1 * brushScale + offset, offset, strokeLength / 1 * brushScale + offset, offset);
  }
}

function brushLargeStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.05, 0.5) * brushScale);
  brushLayer.noFill();
  brushLayer.ellipse(0, 0, strokeLength * 0.02 * brushScale, strokeLength * 0.02 * brushScale);
  brushLayer.line(-strokeLength / 0.5 * brushScale, 0, strokeLength / 0.5 * brushScale, 0);
}

function mousePressed() {
  if (state === "intro") {
    state = "transition";
    return;
  }

  if (state === "art") {
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
                                           2, 
                                           color(topTextColor), 
                                           textSizeTop, 
                                           false);

      bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                              artOriginY + artHeight + bottomAreaHeight/2 + textSizeBottom/3.5, 
                                              2, 
                                              color(bottomTextColor), 
                                              textSizeBottom, 
                                              true);

      layerFrameCount = 0;
    }, () => {
      console.error('Failed to load the next image.');
    });
  }
}
