// Gen Brush Art 設定
let imgNames = [
  'https://cdn.midjourney.com/2a8bf6da-57c9-4ac4-ab1c-9713e61dbb0a/0_0.png',
  'https://cdn.midjourney.com/4e4fb676-044a-4572-ae09-44cb3f1610f8/0_0.png',
  'https://cdn.midjourney.com/eea6726d-3ad8-474a-a32e-3c4031ac9cec/0_0.png',
  'https://cdn.midjourney.com/f2ceee81-7ec7-410d-b4b7-7559c0a4eb84/0_3.png',
  'https://cdn.midjourney.com/52179429-8ca9-4a07-aadf-e0594d93f0e0/0_2.png',
  'https://cdn.midjourney.com/debc4856-f724-4021-928d-79ed65707516/0_0.png'
];
let imgIndex = 0;
let img;
let strokesPerFrame = 500; // ストロークの数を調整
let hueRange = 30; // 色相の範囲

let currentBrush = 1; // 現在選択されているブラッシュストローク

// マウスの動き計算用
let prevMouseX = 0;
let prevMouseY = 0;
let mouseSpeed = 0;
let cumulativeDistance = 0; // 累積移動距離
let hueBase = 0; // ベースとなる色相

// タイマーの設定（15秒ごとに画像を変更）
let imageChangeInterval = 25000; // ミリ秒単位
let imageChangeTimer;

// フェードアウト用のグラフィックスレイヤー
let fadeGraphics;
let fading = false;
let fadeStartTime = 0;
let fadeDuration = 2000; // 7秒

// Main brush art graphics
let mainGraphics;

let imgLoaded = false;

function preload() {
  // preload() は同期的にリソースをロードします。
  img = loadImage(imgNames[imgIndex]);
}

function setup() {
  colorMode(HSB, 255);
  createCanvas(img.width, img.height); // 画像のサイズに基づいてキャンバスを作成
  background(255);
  pixelDensity(1);

  img.loadPixels();

  // メイングラフィックスレイヤーを作成
  mainGraphics = createGraphics(width, height);
  mainGraphics.clear();

  // フェードアウト用のグラフィックスレイヤーを作成
  fadeGraphics = createGraphics(width, height);
  fadeGraphics.clear();

  prevMouseX = mouseX;
  prevMouseY = mouseY;
  currentBrush = int(random(1, 6)); // ランダムでブラッシュストロークを選択

  // hueBaseを初期化
  hueBase = random(0, 255);

  imgLoaded = true; // preload() が完了したので true

  // 画像変更タイマーの開始
  imageChangeTimer = setInterval(changeImage, imageChangeInterval);
}

function draw() {
  // フェードアウト処理
  if (fading && fadeGraphics) {
    let elapsed = millis() - fadeStartTime;
    let alpha = map(elapsed, 0, fadeDuration, 255, 0);
    alpha = constrain(alpha, 0, 255);

    // フェードアウト中のグラフィックスを描画（透明度を適用）
    push();
    tint(255, alpha);
    image(fadeGraphics, 0, 0);
    pop();

    if (elapsed >= fadeDuration) {
      fading = false;
      fadeGraphics.clear(); // フェードアウト完了後にクリア
    }
  }

  // メイングラフィックスをキャンバスに描画
  if (mainGraphics) {
    image(mainGraphics, 0, 0);
  }

  // ブラッシュアートを描画
  if (imgLoaded && img && img.pixels.length > 0) {
    drawBrushArt();
  }
}

function drawBrushArt() {
  // マウス移動距離を計算して累積
  mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  cumulativeDistance += mouseSpeed;

  // 色相を累積距離に基づいて変更（255を超えたらループする）
  hueBase = (hueBase + (cumulativeDistance * 0.1)) % 255;

  let pixels = img.pixels;

  mainGraphics.push(); // メイングラフィックスに描画開始

  for (let i = 0; i < strokesPerFrame; i++) {
    let x = int(random(img.width));
    let y = int(random(img.height));
    let index = (x + y * img.width) * 4;

    if (index + 3 >= pixels.length) continue;

    // RGB値を取得
    let r = pixels[index];
    let g = pixels[index + 1];
    let b = pixels[index + 2];

    // 彩度を取得
    let col = color(r, g, b);
    let br = brightness(col); // 明度
    let sat = saturation(col); // 彩度

    if (br > 190) continue; // 高明度を除外

    // 距離に基づいて色相を調整
    let h = (hueBase + random(-hueRange, hueRange)) % 255;
    if (h < 0) h += 255; // 色相が負にならないように調整
    let strokeColor = color(h, sat, br);

    // 描画
    mainGraphics.push();
    mainGraphics.translate(x, y);
    let strokeLength = map(mouseSpeed, 0, 50, 5, 20); // ストロークの長さをマウス速度に基づいて調整
    mainGraphics.rotate(random(TWO_PI)); // ランダムな方向にストローク

    switch (currentBrush) {
      case 1:
        brushMediumStroke(mainGraphics, strokeColor, strokeLength);
        break;
      case 2:
        brushCircleStroke(mainGraphics, strokeColor, strokeLength);
        break;
      case 3:
        brushDigitalStroke(mainGraphics, strokeColor, strokeLength);
        break;
      case 4:
        brushDiagonalStroke(mainGraphics, strokeColor, strokeLength);
        break;
      case 5:
        brushWaveStroke(mainGraphics, strokeColor, strokeLength);
        break;
    }

    mainGraphics.pop();
  }

  mainGraphics.pop();

  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function brushMediumStroke(pg, strokeColor, strokeLength) {
  pg.stroke(strokeColor);
  pg.strokeWeight(random(1, 2)); // 細いストローク
  pg.line(-strokeLength / 2, 0, strokeLength / 2, 0);
}

function brushCircleStroke(pg, strokeColor, strokeLength) {
  pg.stroke(strokeColor);
  pg.noFill();
  pg.strokeWeight(1);
  pg.ellipse(0, 0, strokeLength, strokeLength);
}

function brushDigitalStroke(pg, strokeColor, strokeLength) {
  pg.stroke(strokeColor);
  pg.strokeWeight(1);
  pg.rect(-strokeLength / 2, -strokeLength / 2, strokeLength, strokeLength);
}

function brushDiagonalStroke(pg, strokeColor, strokeLength) {
  pg.stroke(strokeColor);
  pg.strokeWeight(1);
  pg.line(-strokeLength / 2, -strokeLength / 2, strokeLength / 2, strokeLength / 2);
}

function brushWaveStroke(pg, strokeColor, strokeLength) {
  pg.stroke(strokeColor);
  pg.noFill();
  pg.strokeWeight(1);
  pg.beginShape();
  for (let i = 0; i < 5; i++) {
    pg.vertex(random(-strokeLength / 2, strokeLength / 2), random(-strokeLength / 2, strokeLength / 2));
  }
  pg.endShape(CLOSE);
}

function keyPressed() {
  if (key >= '1' && key <= '5') {
    currentBrush = int(key);
  }
}

function mousePressed() {
  changeImage();
}

// 画像をランダムに変更する関数
function changeImage() {
  if (imgNames.length === 0) return;

  let newIndex;
  do {
    newIndex = int(random(imgNames.length));
  } while (newIndex === imgIndex && imgNames.length > 1); // 同じ画像が連続しないように

  imgIndex = newIndex;

  // 現在のメイングラフィックスをフェードアウト用のグラフィックスにコピー
  fadeGraphics.image(mainGraphics, 0, 0);
  fading = true;
  fadeStartTime = millis();

  imgLoaded = false; // 新しい画像のロード開始

  // 新しい画像のロード
  loadImage(imgNames[imgIndex], (newImg) => {
    img = newImg;
    img.loadPixels();

    cumulativeDistance = 0; // 累積距離をリセット

    // キャンバスのサイズが異なる場合に対応
    if (img.width !== width || img.height !== height) {
      resizeCanvas(img.width, img.height);
      mainGraphics.resizeCanvas(img.width, img.height);
      fadeGraphics.resizeCanvas(img.width, img.height);
      // mainGraphics.clear(); // クリアしないことで既存のブラッシュアートを保持
    }

    // hueBaseをランダムに変更
    hueBase = random(0, 255);

    imgLoaded = true; // 新しい画像のロード完了
  }, () => {
    console.error('Failed to load the next image.');
    imgLoaded = false;
  });
}

// ページがアンロードされる際にタイマーをクリア
function unload() {
  if (imageChangeTimer) {
    clearInterval(imageChangeTimer);
  }
}

// p5.jsのイベントでページ離脱時にunloadを呼び出す
window.addEventListener('beforeunload', unload);
