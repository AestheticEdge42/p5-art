// グローバル変数の宣言

// 画像ファイルのパスを格納する配列
let imgNames = [
  'assets/images/11.png',
  'assets/images/22.png',
  'assets/images/3.png',
  'assets/images/4.png',
];

// 現在表示中の画像のインデックス
let imgIndex = 0;

// 現在の画像オブジェクト
let img;

// 画像がロードされたかどうかのフラグ
let imgLoaded = false;

// フレームごとのストローク量（ブラシの動きの密度）
let baseStrokesPerFrame = 600; // 基本のストローク数
let currentStrokesPerFrame = baseStrokesPerFrame; // 現在のストローク数

// 色相の基準値
let hueBase = 0;

// 色相の変動範囲
let hueRange = 30;

// ロゴ画像オブジェクト
let logo;

// アスペクト比（幅/高さ）
let aspectRatio = 16 / 9;

// フィルターが適用されたかどうかのフラグ
let filterApplied = false;

// フィルターの高さ
let filterHeight;

// ロゴの幅と高さ
let logoWidth, logoHeight;

// ロゴのマージン（X方向とY方向）
let logoMarginX, logoMarginY;

// 前のマウスのX座標とY座標
let prevMouseX = 0;
let prevMouseY = 0;

// マウスの速度
let mouseSpeed = 0;

// 前の角度（ブラシの回転用）
let prevAngle = 0;

// 使用するフォント
let font;

// 上部と下部のスクロールテキストオブジェクト
let topScrollingText;
let bottomScrollingText;

// 上部と下部のテキストカラー（HSB形式）
let topTextColor = [255, 155, 205];
let bottomTextColor = [255, 155, 205];

// 上部と下部のテキストサイズ
let textSizeTop;    
let textSizeBottom; 

// 上部と下部のエリアの高さ
let topAreaHeight = 60;   
let bottomAreaHeight = 60;

// テキストサイズの比率
let textSizeTopRatio = 0.6;   
let textSizeBottomRatio = 0.5;

// ブラシの描画レイヤー
let brushLayer;

// ノイズシード値と背景の色相オフセット
let noiseSeedVal = 0;
let backgroundHueOffset = 0;

// テキストノイズのオフセット
let textNoiseOffsetTop = 0;
let textNoiseOffsetBottom = 1000;

// 各レイヤーの彩度と明度のスケール
let layerSaturationScale = [5.5, 3.0, 6.0, 4.0];
let layerBrightnessScale = [1.8, 1.2, 1.0, 1.5];

// 現在のレイヤーフレームカウント
let layerFrameCount = 0;

// 最大フレーム数（1レイヤーあたり）
let maxLayerFrames = 700; 

// レイヤー情報ボックスのサイズと位置
let layerInfoWidth = 300;
let layerInfoHeight = 160; // Instructionボタン分追加
let layerInfoX = 40;
let layerInfoY = 50;

// プログレスバーのサイズ
let progressBarWidth = 200;
let progressBarHeight = 20;

// レイヤー3用の青色
let blueColorForLayer3 = [150, 155, 255];

// 現在の状態（イントロ、アート、トランジションなど）
let state = "intro";

// イントロダクションテキスト
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

// レインボーメッセージ
let rainbowMessage = "To start the art, please click anywhere on the screen.";

// インストラクションの高さとテキストサイズの係数
let instructionsHeightFactor = 0.25;
let instructionsBaseTextSizeFactor = 0.024;

// インストラクションのY座標と高さ
let instructionsY;
let instructionsHeight;

// イントロテキストのサイズ
let introTextSize;

// レインボーの色相
let rainbowHue = 0;

// オーバーレイの透明度
let overlayAlpha = 255;

// インストラクションのスケール
let instructionScale = 1;

// 次のレイヤーへのメッセージ
let nextLayerMessage = "Click to move on \nto the next art layer.";

// マージンとアートのサイズ・位置
let marginX, marginY;
let artWidth, artHeight;
let artOriginX, artOriginY;

// ブラシのスケール
let brushScale;

// インストラクションの表示フラグ
let showInstructions = true; 

// インストラクションボタンの位置とサイズ
let instructionButtonX, instructionButtonY, instructionButtonW, instructionButtonH;

// 画像保存フラグ（SキーでUIなし画像保存）
let savingImage = false; // SキーでUIなし画像保存フラグ

/**
 * ScrollingTextクラス
 * スクロールするテキストを管理するクラス
 */
class ScrollingText {
  /**
   * コンストラクタ
   * @param {string} text 表示するテキスト
   * @param {number} y テキストの初期Y位置
   * @param {number} speed スクロールの速度
   * @param {color} colorVal テキストの色
   * @param {number} size テキストのサイズ
   * @param {boolean} reverseScroll スクロールの方向（trueなら逆方向）
   */
  constructor(text, y, speed, colorVal, size, reverseScroll = false) {
    this.text = text;
    this.baseY = y;
    this.y = y;
    this.speed = speed;
    this.colorVal = colorVal;
    this.size = size;
    this.reverseScroll = reverseScroll;
    
    // フォントをポイントに変換（ベクター形式）
    this.points = font.textToPoints(this.text, 0, 0, this.size, { sampleFactor: 0.7, simplifyThreshold: 0 });
    
    // テキストの幅を取得
    this.textWidthValue = this.getTextWidth();
    
    this.x = 0; // テキストの初期X位置
    this.gap = 200; // テキスト間のギャップ
    
    // 各ドットの状態を管理（点灯/消灯）
    this.dots = this.points.map(p => ({ x: p.x, y: p.y, on: true }));
  }

  /**
   * テキストの幅を取得するメソッド
   * @returns {number} テキストの幅
   */
  getTextWidth() {
    let bounds = font.textBounds(this.text, 0, 0, this.size);
    return bounds.w;
  }

  /**
   * テキストの位置を更新するメソッド
   * @param {number} noiseOffset ノイズのオフセット値
   */
  update(noiseOffset) {
    if (this.reverseScroll) {
      // 逆方向にスクロール
      this.x += this.speed;
      if (this.x > (this.textWidthValue + this.gap)) this.x = 0;
    } else {
      // 通常方向にスクロール
      this.x -= this.speed;
      if (this.x < -(this.textWidthValue + this.gap)) this.x = 0;
    }
    
    // ノイズを使ってY座標を揺らす
    this.y = this.baseY + map(noise(noiseOffset), 0, 1, -3, 3);
    
    // ドットの点灯・消灯をランダムに変更
    this.dots.forEach(dot => { if (random(1) < 0.02) dot.on = !dot.on; });
  }

  /**
   * テキストを表示するメソッド
   */
  display() {
    push();
    translate(this.x, this.y);
    fill(this.colorVal);
    noStroke();
    // 点灯しているドットを描画
    for (let dot of this.dots) if (dot.on) ellipse(dot.x, dot.y, 3, 3);
    pop();

    push();
    // ギャップ分だけ位置をずらしてもう一つテキストを描画（ループ効果）
    translate(this.x + (this.reverseScroll ? -(this.textWidthValue + this.gap) : (this.textWidthValue + this.gap)), this.y);
    fill(this.colorVal);
    noStroke();
    for (let dot of this.dots) if (dot.on) ellipse(dot.x, dot.y, 3, 3);
    pop();
  }
}

/**
 * preload関数
 * 画像やフォントのプリロードを行う
 */
function preload() {
  // 現在の画像をロード
  img = loadImage(imgNames[imgIndex], () => {
    imgLoaded = true;
    aspectRatio = img.width / img.height; // アスペクト比を計算
  }, () => { console.error('Failed to load the image.'); });

  // ロゴ画像をロード
  logo = loadImage('assets/images/Marelli_logo_BW_NEG_low.png', () => {}, () => {
    console.error('Failed to load the logo image.');
  });

  // フォントをロード
  font = loadFont('assets/fonts/SourceCodePro-Regular.otf', 
    () => { console.log('Font loaded successfully.'); },
    () => { console.error('Failed to load the font.'); }
  );
}

/**
 * setup関数
 * 初期設定を行う
 */
function setup() {
  createCanvas(windowWidth, windowHeight); // キャンバスの作成
  colorMode(HSB, 255); // 色モードをHSBに設定
  textFont(font); // 使用するフォントを設定
  frameRate(30); // フレームレートを設定
  calculateResponsiveSizes(); // レスポンシブなサイズを計算

  // ブラシレイヤーの作成
  brushLayer = createGraphics(artWidth, artHeight);
  brushLayer.colorMode(HSB, 255);
  brushLayer.clear(); // レイヤーをクリア
  if (imgLoaded) img.loadPixels(); // 画像のピクセルデータをロード

  // 上部と下部のスクロールテキストの初期化
  topScrollingText = new ScrollingText(
    "HAPPY NEW YEAR 2025", 
    artOriginY - topAreaHeight + topAreaHeight / 2 + textSizeTop / 3, 
    2, 
    color(topTextColor), 
    textSizeTop, 
    false
  );

  bottomScrollingText = new ScrollingText(
    "Find your core, Aim for more", 
    artOriginY + artHeight + bottomAreaHeight / 2 + textSizeBottom / 3.5, 
    2, 
    color(bottomTextColor), 
    textSizeBottom, 
    true
  );

  // インストラクションのセットアップ
  setupInstructions();
}

/**
 * calculateResponsiveSizes関数
 * レスポンシブなサイズを計算する
 */
function calculateResponsiveSizes() {
  marginX = width * 0.05; // 横マージンを画面幅の5%に設定
  marginY = height * 0.1; // 縦マージンを画面高さの10%に設定

  let tempArtWidth = width - 2 * marginX;
  let tempArtHeight = tempArtWidth / aspectRatio;

  // アートの幅と高さを画面サイズに合わせて調整
  if (tempArtHeight > height - 2 * marginY) {
    artHeight = height - 2 * marginY;
    artWidth = artHeight * aspectRatio;
  } else {
    artWidth = tempArtWidth;
    artHeight = tempArtHeight;
  }

  // アートの原点を中央に設定
  artOriginX = (width - artWidth) / 2;
  artOriginY = (height - artHeight) / 2;

  // ブラシのスケールを計算
  brushScale = min(artWidth, artHeight) / 1000;

  // テキストサイズを計算
  textSizeTop = topAreaHeight * textSizeTopRatio;
  textSizeBottom = bottomAreaHeight * textSizeBottomRatio;

  // ロゴのサイズを計算
  logoWidth = artWidth * 0.08; 
  if (logo && logo.width !== 0 && logo.height !== 0) {
    logoHeight = logo.height * (logoWidth / logo.width);
  } else {
    logoHeight = logoWidth;
  }
  logoMarginX = artWidth * 0.05; 
  logoMarginY = artHeight * 0.05; 

  // レイヤー情報ボックスの位置を右側に設定
  layerInfoX = artOriginX + artWidth - layerInfoWidth - 20; // アートエリアの右端から20px左に配置
  layerInfoY = artOriginY + 20; // アートエリアの上端から20px下に配置

  // プログレスバーのサイズをアートサイズに基づいて設定
  progressBarWidth = artWidth * 0.1; 
  progressBarHeight = artHeight * 0.02;

  // インストラクションボタンのサイズと位置を設定
  instructionButtonW = 150; // 幅を150pxに変更
  instructionButtonH = 40;  // 高さを40pxに変更
  instructionButtonX = layerInfoX + (layerInfoWidth - instructionButtonW) / 2; // レイヤー情報ボックス内中央に配置
  instructionButtonY = layerInfoY + layerInfoHeight - instructionButtonH - 10; // レイヤー情報ボックスの下部から10px上に配置
}

/**
 * windowResized関数
 * ウィンドウがリサイズされたときに呼ばれる
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // キャンバスのサイズをリサイズ
  calculateResponsiveSizes(); // レスポンシブなサイズを再計算

  if (brushLayer) {
    let oldBrush = brushLayer.get(); // 既存のブラシレイヤーを取得
    brushLayer.resizeCanvas(artWidth, artHeight); // ブラシレイヤーのサイズをリサイズ
    brushLayer.image(oldBrush, 0, 0, artWidth, artHeight); // 既存のブラシを再描画
  }

  // スクロールテキストを再初期化
  topScrollingText = new ScrollingText(
    "HAPPY NEW YEAR 2025", 
    artOriginY - topAreaHeight + topAreaHeight / 2 + textSizeTop / 3, 
    2, 
    color(topTextColor), 
    textSizeTop, 
    false
  );

  bottomScrollingText = new ScrollingText(
    "Find your core, Aim for more", 
    artOriginY + artHeight + bottomAreaHeight / 2 + textSizeBottom / 3.5, 
    2, 
    color(bottomTextColor), 
    textSizeBottom, 
    true
  );

  // インストラクションのセットアップを再実行
  setupInstructions();
}

/**
 * setupInstructions関数
 * インストラクションの初期設定を行う
 */
function setupInstructions() {
  let dim = min(width, height);
  introTextSize = dim * instructionsBaseTextSizeFactor * instructionScale; // テキストサイズを計算
  instructionsHeight = height * instructionsHeightFactor; // インストラクションエリアの高さを設定
  if (state === "intro") instructionsY = (height - instructionsHeight) / 2; // インストラクションエリアのY位置を中央に設定
}

/**
 * draw関数
 * 描画ループ
 */
function draw() {
  background(0); // 背景を黒に設定

  if (imgLoaded) {
    // 背景の色相オフセットを更新
    backgroundHueOffset = (backgroundHueOffset + 0.1) % 255;
    drawBackgroundGradient(); // 背景のグラデーションを描画
    
    // stateが "intro" でない場合にのみブラッシュアートを描画
    if (state !== "intro") {
      drawBrushArt(); // ブラシアートを描画
    }
    
    image(brushLayer, artOriginX, artOriginY, artWidth, artHeight); // ブラシレイヤーをキャンバスに表示

    // 上部エリアの黒い矩形を描画（テキスト背景用）
    noStroke();
    fill(0);
    rect(artOriginX, artOriginY - topAreaHeight, artWidth, topAreaHeight);

    // テキストノイズのオフセットを更新
    textNoiseOffsetTop += 0.01;
    textNoiseOffsetBottom += 0.01;

    // 上部のスクロールテキストをクリッピング領域内で更新・表示
    push();
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(artOriginX, artOriginY - topAreaHeight, artWidth, topAreaHeight);
    ctx.clip(); // クリッピング領域を設定
    topScrollingText.update(textNoiseOffsetTop); // テキストの位置を更新
    topScrollingText.display(); // テキストを表示
    ctx.restore();
    pop();

    // 下部エリアの黒い矩形を描画（テキスト背景用）
    noStroke();
    fill(0);
    rect(artOriginX, artOriginY + artHeight, artWidth, bottomAreaHeight);

    // 下部スクロールテキストのY座標を設定
    bottomScrollingText.baseY = artOriginY + artHeight + bottomAreaHeight / 2 + textSizeBottom / 3.5;
    bottomScrollingText.y = bottomScrollingText.baseY;

    // 下部のスクロールテキストをクリッピング領域内で更新・表示
    push();
    ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(artOriginX, artOriginY + artHeight, artWidth, bottomAreaHeight);
    ctx.clip(); // クリッピング領域を設定
    bottomScrollingText.update(textNoiseOffsetBottom); // テキストの位置を更新
    bottomScrollingText.display(); // テキストを表示
    ctx.restore();
    pop();

    // フィルターが適用されていなければ適用
    if (!filterApplied) {
      drawFilterOverArt(artHeight); // フィルターを描画
      filterApplied = true; // フィルター適用フラグを設定
    }

    // アート上にロゴを描画
    drawLogoOnArt(artHeight);
  }

  // トランジション状態の処理
  if (state === "transition") {
    overlayAlpha = lerp(overlayAlpha, 0, 0.05); // オーバーレイの透明度を徐々に下げる
    if (overlayAlpha < 1) {
      overlayAlpha = 0;
      state = "art"; // 状態をアートに変更
      showInstructions = false; // インストラクションを非表示に設定
    }
  }

  // 画像を保存中でなければUIの描画
  if (!savingImage) {
    // 初期画面やトランジション中の場合のオーバーレイとインストラクションの表示
    if ((state === "intro" || state === "transition") && overlayAlpha > 0) {
      push();
      noStroke();
      fill(0, overlayAlpha); // オーバーレイの色と透明度を設定
      rect(0, 0, width, height); // オーバーレイを描画
      displayInstructions(); // インストラクションを表示
      pop();
    } else if (state === "art" && showInstructions) {
      // アート状態でインストラクションボタンをクリックした場合の中央オーバーレイ
      push();
      noStroke();
      fill(0, 200); // 背景色と透明度
      let boxWidth = width * 0.6;  // ボックスの幅を画面幅の60%に設定
      let boxHeight = height * 0.4; // ボックスの高さを画面高さの40%に設定
      rect((width - boxWidth) / 2, (height - boxHeight) / 2, boxWidth, boxHeight, 20); // 中央にボックスを描画
      pop();
      displayInstructions(); // インストラクションテキストを表示
    }

    if (state === "art") {
      displayLayerInfo();
    }
  }

  // アート状態でフレームカウントを増加
  if (state === "art") {
    layerFrameCount++;
  }
}

/**
 * displayInstructions関数
 * インストラクションを表示する
 */
function displayInstructions() {
  push();
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(introTextSize);
  textLeading(introTextSize * 1.5);

  let displayText = introText;
  if (state === 'art') {
    // アート状態では特定のメッセージを除外
    let lines = displayText.split('\n').filter(line => line !== rainbowMessage);
    displayText = lines.join('\n');
  }

  let lines = displayText.split('\n');

  if (state === "intro" || (state === "art" && showInstructions)) {
    // 中央にテキストを表示
    let boxWidth = width * 0.6;
    let boxHeight = height * 0.4;
    text(lines.join('\n'), width / 2, height / 2);
  }

  if (state === 'intro') {
    // レインボーメッセージの色相を変化させて表示
    let rainbowLineIndex = lines.indexOf(rainbowMessage);
    if (rainbowLineIndex >= 0) {
      rainbowHue = (rainbowHue + 4) % 255; // 色相を更新
      fill(rainbowHue, 155, 255); // レインボー色を設定
      let lineHeight = introTextSize * 1.5; // 行の高さを計算
      let textBlockY = height / 2; // テキストブロックのY位置を計算
      let rainbowY = textBlockY - (lineHeight * (lines.length / 2 - rainbowLineIndex - 0.5)); // レインボーメッセージのY位置を計算
      text(lines[rainbowLineIndex], width / 2, rainbowY); // レインボーメッセージを表示
    }
  }
  pop();
}

/**
 * drawBackgroundGradient関数
 * 背景のグラデーションを描画する
 */
function drawBackgroundGradient() {
  for (let y = 0; y < height; y++) {
    let inter = y / height; // 画面の縦方向の割合を計算
    let h = (backgroundHueOffset + inter * 10) % 255; // 色相を計算
    let s = 80; // 彩度を固定
    let b = map(inter, 0, 1, 180, 80); // 明度を上下に変化させる
    stroke(h, s, b); // 色を設定
    line(0, y, width, y); // 水平線を描画
  }
}

/**
 * drawBrushArt関数
 * ブラシアートを描画する
 */
function drawBrushArt() {
  // マウスの速度を計算
  mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  if (mouseSpeed > 0) {
    // マウスの移動角度を計算
    prevAngle = atan2(mouseY - prevMouseY, mouseX - prevMouseX);
    // 色相を更新
    hueBase = (hueBase + mouseSpeed * 0.5) % 255;
  }

  let noiseScale = 0.001; // ノイズのスケール
  let strokesDrawn = 0; // 描画されたストロークの数

  // フレームごとにストロークを描画
  for (let i = 0; i < currentStrokesPerFrame; i++) { // 修正: strokesPerFrame -> currentStrokesPerFrame
    let nx = random(brushLayer.width); // ブラシレイヤーのランダムなX位置
    let ny = random(brushLayer.height); // ブラシレイヤーのランダムなY位置
    let nVal = noise(nx * noiseScale, ny * noiseScale, frameCount * 0.0005); // ノイズ値を取得

    // ノイズ値が低い場合はストロークをスキップ
    if (nVal < 0.05) continue;

    // アートレイヤー上の対応するピクセルを取得
    let x = int(map(nx, 0, brushLayer.width, 0, img.width));
    let y = int(map(ny, 0, brushLayer.height, 0, img.height));
    let index = (x + y * img.width) * 4; // ピクセルデータのインデックス

    let r = img.pixels[index];
    let g = img.pixels[index + 1];
    let b = img.pixels[index + 2]; 
    let a = img.pixels[index + 3];

    // 透明なピクセルはスキップ
    if (a < 10) continue;

    let col = color(r, g, b); // ピクセルの色を取得
    let br = brightness(col); // 明度を取得
    let s = saturation(col); // 彩度を取得
    s = min(s * layerSaturationScale[imgIndex], 255); // 彩度をスケール
    br = min(br * layerBrightnessScale[imgIndex], 255); // 明度をスケール

    let strokeColor;
    // 画像インデックスごとのストロークカラーを決定
    if (imgIndex === 0) {
      if (br > 254) {
        strokeColor = color(100, 100, 255); // 明るい色
      } else if (br < 150) {
        strokeColor = color(0, 0, 0); // 黒色
      } else {
        let h = (hueBase + random(-hueRange, hueRange)) % 255;
        if (h < 0) h += 255;
        strokeColor = color(h, s, br); // ランダムな色相
      }
    } else if (imgIndex === 1) {
      strokeColor = (br > 128) ? color(0, 0, 255) : color(0, 0, 0); // 明るさに基づく色
    } else if (imgIndex === 2) {
      strokeColor = (br > 128) ? color(0, 0, 255) : color(blueColorForLayer3[0], blueColorForLayer3[1], blueColorForLayer3[2]); // 特定の青色
    } else {
      if (br < 50) {
        strokeColor = color(0, 0, 0); // 黒色
      } else if (br > 220) {
        continue; // 非常に明るい部分はスキップ
      } else {
        let h = (hueBase + random(-hueRange, hueRange)) % 255;
        if (h < 0) h += 255;
        strokeColor = color(h, s, br); // ランダムな色相
      }
    }

    // ブラシレイヤーにストロークを描画
    brushLayer.push();
    brushLayer.translate(nx, ny); // ストロークの位置に移動
    brushLayer.rotate(prevAngle); // ストロークの角度を回転
    let strokeLength = map(mouseSpeed, 0, 50, 10, 50) * brushScale; // ストロークの長さを計算
    let strokeType = int(random(3)); // ストロークのタイプをランダムに選択
    if (strokeType === 0) brushFineStroke(strokeColor, strokeLength); // 細いストローク
    else if (strokeType === 1) brushMediumStroke(strokeColor, strokeLength); // 中くらいのストローク
    else brushLargeStroke(strokeColor, strokeLength); // 大きいストローク
    brushLayer.pop();

    strokesDrawn++; // 描画されたストロークの数を増加
  }

  // このフレームで一度もストロークが描かれなかった場合、
  // 不透明ピクセルを持つランダムな点を選んで1本だけ強制的に描く
  if (strokesDrawn === 0 && imgLoaded) {
    for (let tries = 0; tries < 1000; tries++) {
      let nx = random(brushLayer.width);
      let ny = random(brushLayer.height);
      let x = int(map(nx, 0, brushLayer.width, 0, img.width));
      let y = int(map(ny, 0, brushLayer.height, 0, img.height));
      let index = (x + y * img.width) * 4;

      let r = img.pixels[index];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2]; 
      let a = img.pixels[index + 3];
      if (a < 10) continue; // 不透明ピクセルを探す

      let col = color(r, g, b);
      let br = brightness(col);
      let s = saturation(col);
      s = min(s * layerSaturationScale[imgIndex], 255); 
      br = min(br * layerBrightnessScale[imgIndex], 255);

      let strokeColor;
      // 画像インデックスごとのストロークカラーを決定
      if (imgIndex === 0) {
        if (br > 254) strokeColor = color(100, 100, 255);
        else if (br < 150) strokeColor = color(0, 0, 0);
        else {
          let h = (hueBase + random(-hueRange, hueRange)) % 255;
          if (h < 0) h += 255;
          strokeColor = color(h, s, br);
        }
      } else if (imgIndex === 1) {
        strokeColor = (br > 128) ? color(0, 0, 255) : color(0, 0, 0);
      } else if (imgIndex === 2) {
        strokeColor = (br > 128) ? color(0, 0, 255) : color(blueColorForLayer3[0], blueColorForLayer3[1], blueColorForLayer3[2]);
      } else {
        if (br < 50) strokeColor = color(0, 0, 0);
        else if (br > 220) continue;
        else {
          let h = (hueBase + random(-hueRange, hueRange)) % 255;
          if (h < 0) h += 255;
          strokeColor = color(h, s, br);
        }
      }

      // ブラシレイヤーに強制的にストロークを描画
      brushLayer.push();
      brushLayer.translate(nx, ny); // ストロークの位置に移動
      brushLayer.rotate(prevAngle); // ストロークの角度を回転
      let strokeLength = map(mouseSpeed, 0, 50, 10, 50) * brushScale; // ストロークの長さを計算
      let strokeType = int(random(3)); // ストロークのタイプをランダムに選択
      if (strokeType === 0) brushFineStroke(strokeColor, strokeLength); // 細いストローク
      else if (strokeType === 1) brushMediumStroke(strokeColor, strokeLength); // 中くらいのストローク
      else brushLargeStroke(strokeColor, strokeLength); // 大きいストローク
      brushLayer.pop();
      break; // 1本描いたらループを終了
    }
  }

  // マウスの現在位置を記録
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

/**
 * drawFilterOverArt関数
 * アート上にフィルターを描画する
 * @param {number} artHeight アートの高さ
 */
function drawFilterOverArt(artHeight) {
  let filterBuffer = createGraphics(artWidth, artHeight); // フィルターバッファを作成
  filterBuffer.clear(); // バッファをクリア
  if (!filterHeight) filterHeight = artHeight * 0.1; // フィルターの高さを設定（初回のみ）

  // フィルター効果を描画
  for (let y = artHeight - filterHeight; y < artHeight; y++) {
    let alpha = map(y, artHeight - filterHeight, artHeight, 0, 55); // 透明度を計算
    filterBuffer.noStroke();
    filterBuffer.fill(0, alpha); // 黒色と透明度を設定
    filterBuffer.rect(0, y, artWidth, 1); // 1ピクセル幅のラインを描画
  }
  image(filterBuffer, artOriginX, artOriginY); // フィルターをアートに重ねる
}

/**
 * drawLogoOnArt関数
 * アート上にロゴを描画する
 * @param {number} artHeight アートの高さ
 */
function drawLogoOnArt(artHeight) {
  if (logo && logo.width !== 0 && logo.height !== 0) {
    let xPosition = artOriginX + artWidth - logoWidth - logoMarginX; // ロゴのX位置を計算
    let yPosition = artOriginY + artHeight - logoHeight - logoMarginY; // ロゴのY位置を計算
    image(logo, xPosition, yPosition, logoWidth, logoHeight); // ロゴを描画
  }
}

/**
 * displayLayerInfo関数
 * レイヤー情報を表示する
 */
function displayLayerInfo() {
  push();
  noStroke();
  fill(0, 180); 
  rect(layerInfoX, layerInfoY, layerInfoWidth, layerInfoHeight, 10); // レイヤー情報ボックスを描画
  pop();

  let centerX = layerInfoX + layerInfoWidth / 2; // ボックスの中央X座標

  push();
  fill(255); // テキスト色を白に設定
  textAlign(CENTER, CENTER);
  textSize(20);
  let layerInfoText = `Layer: ${imgIndex + 1}/${imgNames.length}`;
  text(layerInfoText, centerX, layerInfoY + 30); // レイヤー情報を表示
  pop();

  // プログレスバーの進捗を計算
  let progress = (layerFrameCount / maxLayerFrames) * 100;
  progress = constrain(progress, 0, 100); // 進捗を0〜100に制限

  let barX = centerX - progressBarWidth / 2;
  let barY = layerInfoY + 60; 
  push();
  // プログレスバーの背景を描画
  fill(255, 50);
  rect(barX, barY, progressBarWidth, progressBarHeight, 5);
  // 進捗部分を描画（明るい緑）
  fill(120, 255, 255); // HSBで明るい緑
  let barW = map(progress, 0, 100, 0, progressBarWidth);
  if (barW > 0) rect(barX, barY, barW, progressBarHeight, 5);
  pop();

  push();
  textAlign(CENTER, CENTER);
  textSize(15);
  let messageY = barY + 40;
  if (progress >= 100) {
    rainbowHue = (rainbowHue + 4) % 255;
    fill(rainbowHue, 155, 255);
    text(nextLayerMessage, centerX, messageY); // 次のレイヤーへのメッセージを表示
  } else {
    fill(255);
    text("Now loading", centerX, messageY); // ローディング中のメッセージを表示
  }
  pop();

  // インストラクションボタンの背景色、サイズ、文字色を変更
  push();
  textAlign(CENTER, CENTER);
  textSize(15);
  fill(200, 255, 255, 100); // ボタンの背景色を青色に設定（HSB: hue=200, saturation=255, brightness=255, alpha=100）
  rect(instructionButtonX, instructionButtonY, instructionButtonW, instructionButtonH, 5); // インストラクションボタンの背景を描画
  fill(0, 0, 0); // ボタンの文字色を黒色に設定（HSB: hue=0, saturation=0, brightness=0）
  text("Instruction", instructionButtonX + instructionButtonW / 2, instructionButtonY + instructionButtonH / 2); // ボタンのテキストを表示
  pop();
}

/**
 * brushFineStroke関数
 * 細いストロークを描画する
 * @param {color} strokeColor ストロークの色
 * @param {number} strokeLength ストロークの長さ
 */
function brushFineStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor); // ストローク色を設定
  brushLayer.strokeWeight(random(0.0025, 0.005) * brushScale); // ストロークの太さをランダムに設定
  brushLayer.beginShape(); // 図形の開始
  for (let i = 0; i < 10; i++) {
    let angle = random(TWO_PI); // ランダムな角度を生成
    let radius = random(strokeLength * 0.001, strokeLength * 0.003) * brushScale; // ランダムな半径を生成
    brushLayer.vertex(cos(angle) * radius, sin(angle) * radius); // 頂点を追加
  }
  brushLayer.endShape(CLOSE); // 図形を閉じて描画
}

/**
 * brushMediumStroke関数
 * 中くらいのストロークを描画する
 * @param {color} strokeColor ストロークの色
 * @param {number} strokeLength ストロークの長さ
 */
function brushMediumStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor); // ストローク色を設定
  brushLayer.strokeWeight(random(0.01, 0.05) * brushScale); // ストロークの太さをランダムに設定
  for (let i = 0; i < 5; i++) {
    let offset = random(-strokeLength / 4, strokeLength / 4) * brushScale; // ランダムなオフセットを生成
    brushLayer.line(-strokeLength / 5 * brushScale + offset, offset, strokeLength / 5 * brushScale + offset, offset); // ラインを描画
  }
}

/**
 * brushLargeStroke関数
 * 大きいストロークを描画する
 * @param {color} strokeColor ストロークの色
 * @param {number} strokeLength ストロークの長さ
 */
function brushLargeStroke(strokeColor, strokeLength) {
  brushLayer.stroke(strokeColor); // ストローク色を設定
  brushLayer.strokeWeight(random(0.05, 0.5) * brushScale); // ストロークの太さをランダムに設定
  brushLayer.noFill(); // 塗りを無効に設定
  brushLayer.ellipse(0, 0, strokeLength * 0.02 * brushScale, strokeLength * 0.02 * brushScale); // 楕円を描画
  brushLayer.line(-strokeLength / 10 * brushScale, 0, strokeLength / 10 * brushScale, 0); // ラインを描画
}

/**
 * keyPressed関数
 * キーが押されたときに呼ばれる
 */
function keyPressed() {
  if (key === 'S' || key === 's') {
    savingImage = true; // 画像保存フラグを設定
    noLoop(); // 描画ループを停止
    redraw(); // 一度だけ再描画
    saveCanvas('myArt', 'png'); // キャンバスをPNG形式で保存
    savingImage = false; // 画像保存フラグをリセット
    loop(); // 描画ループを再開
  }
}
