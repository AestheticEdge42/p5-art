// 画像ファイル名のリスト
let imgNames = [
  'assets/images/11.png',
  'assets/images/22.png',
  'assets/images/3.png',
  'assets/images/4.png',
];

// 現在の画像インデックス
let imgIndex = 0;
// 現在の画像オブジェクト
let img;
// 画像が読み込まれたかどうかのフラグ
let imgLoaded = false;
// フレームごとのストローク数
let strokesPerFrame = 1500;
// 色相の基準値
let hueBase = 0;
// 色相の範囲
let hueRange = 30;
// ロゴ画像
let logo;
// 画像のアスペクト比
let aspectRatio = 16 / 9; // デフォルトのアスペクト比
// フィルターが適用されたかどうかのフラグ
let filterApplied = false;
// フィルターの高さ
let filterHeight;
// ロゴの幅と高さ
let logoWidth, logoHeight;
// ロゴのマージン（左右と上下）
let logoMarginX, logoMarginY;

// 前回のマウス位置
let prevMouseX = 0;
let prevMouseY = 0;
// マウスの速度
let mouseSpeed = 0;
// 前回の角度
let prevAngle = 0;

// 使用するフォント
let font;

// 上部と下部のスクロールテキストオブジェクト
let topScrollingText;
let bottomScrollingText;
// 上部と下部のテキストカラー
let topTextColor = [255, 155, 205];
let bottomTextColor = [255, 155, 205];
// 上部と下部のテキストサイズ（後で動的に設定）
let textSizeTop;
let textSizeBottom;
// 上部と下部のテキスト領域の高さ（後で動的に設定）
let topAreaHeight;
let bottomAreaHeight;

// ブラシレイヤー用のグラフィックスオブジェクト
let brushLayer;

// ノイズ生成用のシード値
let noiseSeedVal = 0;
// 背景の色相オフセット
let backgroundHueOffset = 0;
// 上部と下部のテキストのノイズオフセット
let textNoiseOffsetTop = 0;
let textNoiseOffsetBottom = 1000;

// レイヤーごとの彩度・明度補正値
let layerSaturationScale = [5.5, 3.0, 6.0, 4.0];
let layerBrightnessScale = [1.8, 1.2, 1.0, 1.5];

// レイヤーの進行状況を管理する変数
let layerFrameCount = 0;
let maxLayerFrames = 2000; // 最大フレーム数

// レイヤー情報の表示位置（後で動的に設定）
let layerInfoX;
let layerInfoY;
// プログレスバーの位置とサイズ（後で動的に設定）
let progressBarX;
let progressBarY;
let progressBarWidth;
let progressBarHeight;

// レイヤー3用の青色
let blueColorForLayer3 = [150, 155, 255];

// 現在の状態を管理する変数（例: "intro", "transition", "art"）
let state = "intro";

// イントロテキストの内容
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

// "To start the art..."行のメッセージ
let rainbowMessage = "To start the art, please click anywhere on the screen.";

// テキスト表示領域の高さとテキストサイズの係数
let instructionsHeightFactor = 0.25;
let instructionsBaseTextSizeFactor = 0.024;
let instructionsY;
let instructionsHeight;
let introTextSize;
let extraCanvasSpace; // 後で動的に設定
let rainbowHue = 0; // 虹色用の色相

let instructionsTargetY;
let overlayAlpha = 255; // オーバーレイの透明度
let instructionScale = 1; // テキストのスケール

// 次のレイヤーへ進む際のメッセージ（改行を含む）
let nextLayerMessage = "Click to move on \nto the next art layer.";

// スクロールテキストを管理するクラス
class ScrollingText {
  constructor(text, y, speed, color, size, reverseScroll = false) {
    this.text = text;
    this.baseY = y; // 基本のY位置
    this.y = y; // 現在のY位置
    this.speed = speed; // スクロール速度
    this.color = color; // テキストカラー
    this.size = size; // テキストサイズ
    this.reverseScroll = reverseScroll; // 逆方向にスクロールするかどうか

    // テキストを点に変換
    this.points = font.textToPoints(this.text, 0, 0, this.size, {
      sampleFactor: 0.7,
      simplifyThreshold: 0
    });
    this.textWidthValue = this.getTextWidth(); // テキストの幅を取得
    this.x = 0; // 現在のX位置
    this.gap = 200; // テキスト間のギャップ
    // 各点の状態（点が表示されているかどうか）
    this.dots = this.points.map(p => ({
      x: p.x,
      y: p.y,
      on: true
    }));
  }

  // テキストの幅を計算する関数
  getTextWidth() {
    let bounds = font.textBounds(this.text, 0, 0, this.size);
    return bounds.w;
  }

  // テキストの更新処理
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

    // ノイズを利用してY位置を微調整
    this.y = this.baseY + map(noise(noiseOffset), 0, 1, -3, 3);

    // 点の点滅をランダムに制御
    this.dots.forEach(dot => {
      if (random(1) < 0.02) {
        dot.on = !dot.on;
      }
    });
  }

  // テキストの表示処理
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

  // フォントの読み込み（ローカルホストの場合）
  font = loadFont('assets/fonts/sourcecodepro-regular.otf', 
    console.log('Font loaded successfully.');
  }, () => {
    console.error('Failed to load the font.');
  });
}

function setup() {
  calculateResponsiveSizes();
  // キャンバスの作成
  createCanvas(windowWidth*0.6, windowWidth / aspectRatio + extraCanvasSpace);
  colorMode(HSB, 255);
  textFont(font);

  // ブラシレイヤー用のグラフィックスオブジェクトを作成
  brushLayer = createGraphics(width, height - extraCanvasSpace);
  brushLayer.colorMode(HSB, 255);
  brushLayer.clear();

  if (img) {
    img.loadPixels();
  }

  // 上部と下部のスクロールテキストオブジェクトを作成
  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                       topAreaHeight / 2 + textSizeTop / 3, 
                                       2, 
                                       color(topTextColor), 
                                       textSizeTop, 
                                       false);

  bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                          height - bottomAreaHeight / 2 - textSizeBottom / 3.5, 
                                          2, 
                                          color(bottomTextColor), 
                                          textSizeBottom, 
                                          true);

  // ノイズシードを設定
  noiseSeed(noiseSeedVal);
  background(0);

  // インストラクションの設定
  setupInstructions();
}

function calculateResponsiveSizes() {
  // レスポンシブなサイズを計算
  let artHeight = windowWidth / aspectRatio;
  extraCanvasSpace = artHeight * 0.125; // 12.5%の追加スペース
  topAreaHeight = artHeight * 0.1; // 10%のテキスト領域
  bottomAreaHeight = artHeight * 0.1;

  textSizeTop = artHeight * 0.03; // テキストサイズトップ
  textSizeBottom = artHeight * 0.02; // テキストサイズボトム

  // ロゴのサイズとマージンを計算
  logoWidth = width * 0.08;
  if (logo.width !== 0 && logo.height !== 0) {
    logoHeight = logo.height * (logoWidth / logo.width);
  } else {
    logoHeight = logoWidth; // デフォルト値
  }
  logoMarginX = width * 0.05;
  logoMarginY = artHeight * 0.15;

  // レイヤー情報の位置を計算
  layerInfoX = width * 0.05;
  layerInfoY = height * 0.05;

  // プログレスバーの位置とサイズを計算
  progressBarX = width * 0.05;
  progressBarY = layerInfoY + 70;
  progressBarWidth = width * 0.3;
  progressBarHeight = artHeight * 0.015;
}

function windowResized() {
  calculateResponsiveSizes();
  // キャンバスサイズをリサイズ
  resizeCanvas(windowWidth, windowWidth / aspectRatio + extraCanvasSpace);

  // ブラシレイヤーをリサイズ
  if (brushLayer) {
    let oldBrush = brushLayer.get();
    brushLayer.resizeCanvas(width, height - extraCanvasSpace);
    brushLayer.image(oldBrush, 0, 0, width, height - extraCanvasSpace);
  } else {
    console.error('brushLayerが定義されていません。');
  }

  // スクロールテキストを再設定
  topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                       topAreaHeight / 2 + textSizeTop / 3, 
                                       2, 
                                       color(topTextColor), 
                                       textSizeTop, 
                                       false);

  bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                          height - bottomAreaHeight / 2 - textSizeBottom / 3.5, 
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

  let artHeight = windowWidth / aspectRatio;
  
  if (state === "intro") {
    instructionsY = (height - instructionsHeight)/2;
  }

  instructionsTargetY = artHeight; 
}

function draw() {
  background(0);

  let artHeight = windowWidth / aspectRatio;

  if (imgLoaded) {
    // 背景の色相オフセットを更新
    backgroundHueOffset = (backgroundHueOffset + 0.1) % 255;
    // 背景グラデーションを描画
    drawBackgroundGradient();
    // ブラシアートを描画
    drawBrushArt();
    // ブラシレイヤーをキャンバスに表示
    image(brushLayer, 0, 0, width, height - extraCanvasSpace);

    // 上部テキスト領域の背景を描画
    noStroke();
    fill(0);
    rect(0, 0, width, topAreaHeight);

    // テキストのノイズオフセットを更新
    textNoiseOffsetTop += 0.01;
    textNoiseOffsetBottom += 0.01;
    // 上部と下部のスクロールテキストを更新・表示
    topScrollingText.update(textNoiseOffsetTop);
    topScrollingText.display();

    // 下部テキスト領域の背景を描画
    noStroke();
    fill(0);
    rect(0, artHeight - bottomAreaHeight, width, bottomAreaHeight);

    // 下部スクロールテキストの位置を調整
    bottomScrollingText.baseY = artHeight - bottomAreaHeight / 2 - textSizeBottom / 3.5;
    bottomScrollingText.y = bottomScrollingText.baseY;
    bottomScrollingText.update(textNoiseOffsetBottom);
    bottomScrollingText.display();

    // フィルターが適用されていない場合、フィルターを適用
    if (!filterApplied) {
      drawFilterOverArt(artHeight);
      filterApplied = true;
    }

    // ロゴをアートに描画
    drawLogoOnArt(artHeight);
    // 状態が"art"の場合、レイヤー情報を表示
    if (state === "art") displayLayerInfo();
  }

  // オーバーレイの透明度を管理
  if (overlayAlpha > 0) {
    push();
    noStroke();
    fill(0, overlayAlpha);
    rect(0, 0, width, height);
    pop();
  }

  // インストラクションを表示
  displayInstructions();

  // 状態に応じた処理
  if (state === "intro") {
    // イントロの状態ではクリック待ち
  } else if (state === "transition") {
    // トランジション中の処理
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
    // アート状態ではレイヤーフレームカウントを増加
    layerFrameCount++;
  }
}

function displayInstructions() {
  push();
  textAlign(CENTER, CENTER);

  // インストラクション背景の描画
  fill(0, 200);
  noStroke();
  rect(0, instructionsY, width, instructionsHeight);

  // インストラクションテキストの設定
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
  text(lines.join('\n'), width/2, instructionsY + instructionsHeight/2);

  // 虹色明滅ライン("To start the art...")はintro/transition時のみ表示
  if (state !== 'art') {
    let rainbowLineIndex = lines.indexOf(rainbowMessage);
    if (rainbowLineIndex >= 0) {
      // 虹色の明滅
      rainbowHue = (rainbowHue + 4) % 255;
      fill(rainbowHue, 155, 255);
      // 行のY計算
      let lineHeight = introTextSize * 1.5;
      let textBlockY = instructionsY + instructionsHeight/2;
      let rainbowY = textBlockY - (lineHeight * (lines.length/2 - rainbowLineIndex - 0.5));
      text(lines[rainbowLineIndex], width/2, rainbowY);
    }
  }
  pop();
}

function drawBackgroundGradient() {
  // 背景にグラデーションを描画
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
  let artHeight = width / aspectRatio;

  // マウスの移動速度を計算
  mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  if (mouseSpeed > 0) {
    // マウスの移動方向を計算
    prevAngle = atan2(mouseY - prevMouseY, mouseX - prevMouseX);
    // 色相の基準値を更新
    hueBase = (hueBase + mouseSpeed * 0.5) % 255;
  }

  let noiseScale = 0.001;

  // フレームごとのストロークを描画
  for (let i = 0; i < strokesPerFrame; i++) {
    let nx = random(width);
    let ny = random(artHeight);
    let nVal = noise(nx * noiseScale, ny * noiseScale, frameCount * 0.0005);
    if (nVal < 0.3) continue;

    let x = int(map(nx, 0, width, 0, img.width));
    let y = int(map(ny, 0, artHeight, 0, img.height));

    let index = (x + y * img.width) * 4;
    let r = img.pixels[index];
    let g = img.pixels[index + 1];
    let b = img.pixels[index + 2]; 
    let a = img.pixels[index + 3];

    if (a < 10) continue;

    let col = color(r, g, b);
    let br = brightness(col);
    let s = saturation(col);

    // 彩度と明度をレイヤーごとに調整
    s = min(s * layerSaturationScale[imgIndex], 255); 
    br = min(br * layerBrightnessScale[imgIndex], 255);

    let strokeColor;

    // レイヤーごとのストロークカラーの設定
    if (imgIndex === 0) {
      if (br > 254) {
        strokeColor = color(0, 0, 255); // 白
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

    // ブラシレイヤーにストロークを描画
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

  // 現在のマウス位置を記録
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function drawFilterOverArt(artHeight) {
  // アートの上にフィルターを描画
  let filterBuffer = createGraphics(width, artHeight);
  filterBuffer.clear();
  for (let y = artHeight - filterHeight; y < artHeight; y++) {
    let alpha = map(y, artHeight - filterHeight, artHeight, 0, 55);
    filterBuffer.noStroke();
    filterBuffer.fill(0, alpha);
    filterBuffer.rect(0, y, width, 1);
  }
  image(filterBuffer, 0, 0);
}

function drawLogoOnArt(artHeight) {
  // アートの上にロゴを描画
  let xPosition = width - logoWidth - logoMarginX;
  let yPosition = artHeight - logoHeight - logoMarginY;
  image(logo, xPosition, yPosition, logoWidth, logoHeight);
}

function displayLayerInfo() {
  push();
  noStroke();
  fill(0, 180); 
  // レイヤー情報の背景パネルを描画
  rect(layerInfoX, layerInfoY + 20, width * 0.3, height * 0.15, 10);
  pop();

  push();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(height * 0.02);
  // レイヤー情報テキスト（Framesは削除）
  let layerInfo = `Layer: ${imgIndex + 1}/${imgNames.length}`;
  text(layerInfo, layerInfoX + width * 0.15, layerInfoY + height * 0.03);
  pop();

  // プログレスバーの進捗を計算
  let progress = (layerFrameCount / maxLayerFrames) * 100;
  progress = constrain(progress, 0, 100);

  push();
  // プログレスバーの背景
  fill(255, 50);
  rect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5);

  // プログレスバーの進捗部分
  fill(120, 255, 255); // HSBで緑色
  let barWidth = map(progress, 0, 100, 0, progressBarWidth);
  rect(progressBarX, progressBarY, barWidth, progressBarHeight, 5);
  pop();

  // プログレスが100以上の場合、虹色でメッセージを表示
  if (progress >= 100) {
    push();
    textAlign(CENTER, CENTER);
    textSize(height * 0.015);
    // 虹色の色相を更新
    rainbowHue = (rainbowHue + 4) % 255;
    fill(rainbowHue, 155, 255);
    // メッセージを表示
    text(nextLayerMessage, width * 0.2, progressBarY + progressBarHeight + height * 0.03);
    pop();
  } else {
    // プログレスが100未満の場合、「Now loading」を白文字で表示
    push();
    textAlign(CENTER, CENTER);
    textSize(height * 0.015);
    fill(255); // 白色
    text("Now loading", width * 0.2, progressBarY + progressBarHeight + height * 0.03);
    pop();
  }
}

// 細いストロークを描画する関数
function brushFineStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(0.5, 1));
  brushLayer.beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = random(TWO_PI);
    let radius = random(strokeLength * 0.001, strokeLength * 0.003);
    brushLayer.vertex(cos(angle) * radius, sin(angle) * radius);
  }
  brushLayer.endShape(CLOSE);
}

// 中くらいのストロークを描画する関数
function brushMediumStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(1, 3));
  for (let i = 0; i < 5; i++) {
    let offset = random(-strokeLength / 4, strokeLength / 4);
    brushLayer.line(-strokeLength / 2 + offset, offset, strokeLength / 2 + offset, offset);
  }
}

// 大きいストロークを描画する関数
function brushLargeStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor);
  brushLayer.strokeWeight(random(3, 5));
  brushLayer.noFill();
  brushLayer.ellipse(0, 0, strokeLength * 0.02, strokeLength * 0.02);
  brushLayer.line(-strokeLength / 2, 0, strokeLength / 2, 0);
}

// マウスがクリックされたときの処理
function mousePressed() {
  if (state === "intro") {
    // イントロ状態からトランジション状態へ移行
    state = "transition";
    return;
  }

  if (state === "art") {
    // アート状態で次のレイヤーへ進む
    imgIndex = (imgIndex + 1) % imgNames.length;
    imgLoaded = false;

    // 次の画像を読み込む
    loadImage(imgNames[imgIndex], (newImg) => {
      img = newImg;
      img.loadPixels();
      imgLoaded = true;

      let artHeight = width / aspectRatio;

      // 既存のブラシレイヤーをリサイズ
      let oldBrush = brushLayer.get();
      brushLayer.resizeCanvas(width, artHeight);
      brushLayer.image(oldBrush, 0, 0, width, artHeight);

      calculateResponsiveSizes();
      filterApplied = false;

      // スクロールテキストを再設定
      topScrollingText = new ScrollingText("HAPPY NEW YEAR 2025", 
                                           topAreaHeight / 2 + textSizeTop / 3, 
                                           2, 
                                           color(topTextColor), 
                                           textSizeTop, 
                                           false);

      bottomScrollingText = new ScrollingText("Find your core, Aim for more", 
                                              artHeight - bottomAreaHeight / 2 - textSizeBottom / 3.5, 
                                              2, 
                                              color(bottomTextColor), 
                                              textSizeBottom, 
                                              true);

      // レイヤーフレームカウントをリセット
      layerFrameCount = 0;
    }, () => {
      console.error('Failed to load the next image.');
    });
  }
}
