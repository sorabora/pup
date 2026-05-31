"use strict";

let width = 854;
let height = 480;
let paddleHeight = 70;
let speed = -4;
let ballPosition = new pupApi.Vector2(width / 2, height / 2);
let playerPosition = new pupApi.Vector2(30, height / 2);
let opPosition = new pupApi.Vector2(width - 60, height / 2);
let pscore = 0;
let oscore = 0;
let difficultyOptions = await pupApi.enums.createEnum([
  "Easy",
  "Medium",
  "Hard",
]);
let difficulty = new pupApi.Enum(difficultyOptions, "Easy");
let difficultyValue = -2;
switch (
  (function (__enumSwitchValue) {
    return __enumSwitchValue != null && __enumSwitchValue.pupEnumInstance
      ? __enumSwitchValue.value
      : __enumSwitchValue;
  })(difficulty)
) {
  case "Easy":
    difficultyValue = 1.9;
    speed = 3;
    break;
  case "Medium":
    difficultyValue = 3.1;
    speed = 4;
    break;
  case "Hard":
    difficultyValue = 4.4;
    speed = 5;
    break;
}
let ballVelocity = new pupApi.Vector2(speed, speed);
await pupApi.game.createWindow(width, height);
async function updateBall() {
  ballPosition.x += ballVelocity.x;
  ballPosition.y += ballVelocity.y;
}
await pupApi.game.mainLoop(async function () {
  await pupApi.game.clear();
  await pupApi.game.background("Black");
  await pupApi.game.fillColor("White");
  await pupApi.game.text(
    pupAdd(pupAdd(pscore, " - "), oscore),
    width / 2,
    80,
    80,
    pupApi.center,
  );
  await pupApi.game.circle(ballPosition.x, ballPosition.y, 25);
  await pupApi.game.rect(
    playerPosition.x,
    playerPosition.y,
    25,
    paddleHeight,
  );
  await pupApi.game.rect(opPosition.x, opPosition.y, 25, paddleHeight);
  ballPosition.x += ballVelocity.x;
  ballPosition.y += ballVelocity.y;
  if (ballPosition.y <= 0 || ballPosition.y >= height) {
    ballVelocity.y *= -1;
    await updateBall();
  }
  if (ballPosition.x <= 0 || ballPosition.x >= width) {
    if (ballPosition.x <= 0) {
      oscore++;
    } else {
      pscore++;
    }
    ballPosition = new pupApi.Vector2(width / 2, height / 2);
    let a = await pupApi.math.round(await pupApi.math.random(0, 1));
    let b = await pupApi.math.round(await pupApi.math.random(0, 1));
    ballVelocity.x = speed * (a === 0 ? -1 : 1);
    ballVelocity.y = speed * (b === 0 ? -1 : 1);
    await updateBall();
  }
  if (ballPosition.y >= opPosition.y) {
    opPosition.y += difficultyValue;
  } else if (ballPosition.y <= opPosition.y) {
    opPosition.y -= difficultyValue;
  }
  let p = playerPosition;
  let o = opPosition;
  let b = ballPosition;
  if (
    (await pupApi.game.checkCollision(
      p.x,
      p.y,
      30,
      paddleHeight,
      b.x,
      b.y,
      25,
      25,
    )) ||
    (await pupApi.game.checkCollision(
      o.x,
      o.y,
      30,
      paddleHeight,
      b.x,
      b.y,
      25,
      25,
    ))
  ) {
    ballVelocity.x *= -1.15;
    ballVelocity.y *= -1;
    ballPosition.x += ballVelocity.x * 2;
  }
  if ((await pupApi.isKeyDown("w")) && playerPosition.y >= 0) {
    playerPosition.y -= 4;
  }
  if (
    (await pupApi.isKeyDown("s")) &&
    playerPosition.y <= height - paddleHeight
  ) {
    playerPosition.y += 4;
  }
});
