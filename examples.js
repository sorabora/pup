const pupExamples = [
  {
    label: "HTTP ⭐️",
    code: `include http
include console

local object res = http.response("get", "https://httpbin.org/get")
print(res)`,
  },
  {
    label: "SSR site (Node.js) ⭐️",
    code: `include ssr

local string title = "My Example Site"
local string html =
<h1>{{title}}</h1>
<p>Welcome to Pup SSR.</p>
ssr.render(html)`,
  },
  {
    label: "HTML app ⭐️",
    code: `include htmlapp

local string name = "Pup"
local string page =
<main style="font-family: system-ui; max-width: 32rem;">
  <h1>Hello, {{name}}</h1>
  <p>This is a live HTML app in the browser.</p>
</main>
htmlapp.setTitle("Hello App")
htmlapp.render(page)`,
  },
  {
    label: "Vectors ⭐️",
    code: `include vectors
include console

local Vector2 position = new Vector2(1, 2)
position.x = 10
print(position.x)`,
  },
  {
    label: "Age Calculator ⭐️",
    code: `include console
include utils

print("== AGE CALCULATOR ==")

local int year = dialog("What year were you born?")
local int month = dialog("What month were you born? [Enter a number]")
local int day = dialog("What day were you born? [Enter a number]")

local int age = time.currentYear() - year
if time.currentMonth() < month:
  age = age - 1
else if time.currentMonth() == month and time.currentDay() < day:
  age = age - 1
end
print("You are " + age + " years old.")`,
  },
  {
    label: "Platformer ⭐️⭐️",
    code: `include game
include io

local int width = 854
local int height = 480
game.createWindow(width, height)

local double acceleration = 0.5
local double velocity = 0
local object entities = {
  player: {
    color: "Red",
    position: new Vector2(20, 50),
    velocity: new Vector2(0, 0)
  }
}

game.mainLoop(function():
  game.clear()
  game.background("#96f3ff")

  game.fillColor("Gray")
  game.rect(0, height-50, width, 50)
  
  game.fillColor("Red")
  game.rect(entities.player.position.x, entities.player.position.y, 50, 50)
  
  local px = entities.player.position.x
  local py = entities.player.position.y
  
  if !game.checkCollision(px, py, 50, 50, 0, height-50, width, 50):
    entities.player.velocity.y += acceleration
    entities.player.position.y += entities.player.velocity.y
  else:
    entities.player.velocity.x = 0
    entities.player.velocity.y = 0
    if (isKeyDown("w") || isKeyDown(" ")):
      entities.player.velocity.y -= 10
      entities.player.position.y += entities.player.velocity.y
    end
  end
  
  if isKeyDown("d"):
    entities.player.position.x += 5
  end
  if isKeyDown("a"):
    entities.player.position.x -= 5
  end
end)`,
  },
  {
    label: "Pong Lite ⭐️⭐️",
    code: `include game
include io

local int width = 854
local int height = 480

local int paddleHeight = 70
local Vector2 ballPosition = new Vector2(width/2, height/2)
local Vector2 ballVelocity = new Vector2(-4, -2) // throw it towards the player
local Vector2 playerPosition = new Vector2(30, height/2) // start it in the middle
local Vector2 opPosition = new Vector2(width-60, height/2)

game.createWindow(width, height)

function updateBall():
  ballPosition.x += ballVelocity.x
  ballPosition.y += ballVelocity.y
end

game.mainLoop(function():
  game.clear()
  game.background("Black")
  
  game.fillColor("White")
  game.rect(playerPosition.x, playerPosition.y, 25, paddleHeight)
  game.rect(opPosition.x, opPosition.y, 25, paddleHeight)
  game.circle(ballPosition.x, ballPosition.y, 25)
  
  ballPosition.x += ballVelocity.x
  ballPosition.y += ballVelocity.y
  
  // ceil check
  if ballPosition.y <= 0 || ballPosition.y >= height:
    ballVelocity.y *= -1
    updateBall()
  end
  
  // sides check
  if ballPosition.x <= 0 || ballPosition.x >= width:
    ballPosition = new Vector2 (width/2, height/2)
    ballVelocity.x = 2
    ballVelocity.y = 2
    updateBall()
  end
  
  if ballPosition.y >= opPosition.y:
    opPosition.y += 1.6
  else if ballPosition.y <= opPosition.y:
    opPosition.y -= 1.6
  end
  
  local p = playerPosition
  local o = opPosition
  local b = ballPosition
  if game.checkCollision(p.x, p.y, 30, paddleHeight, b.x, b.y, 25, 25) ||
  game.checkCollision(o.x, o.y, 30, paddleHeight, b.x, b.y, 25, 25):
    ballVelocity.x *= -1.15 // slowly add more velocity
    ballVelocity.y *= -1
    ballPosition.x += ballVelocity.x * 2
  end // bounce ball when it hits the player

  if isKeyDown("w") && playerPosition.y >= 0:
    // extra condition prevents player from moving off screen
    playerPosition.y -= 4
  end
  if isKeyDown("s") && playerPosition.y <= height - paddleHeight:
    // this check requires -70 because the collision checks the top of the rectangle
    // not the bottom, so to check bottom you need to offset the collision check
    // by the height of the paddle
    playerPosition.y += 4
  end
end)`,
  },
  {
    label: "Pong ⭐️⭐️⭐️",
    code: `include game
include io
include enums
include math

local int width = 854
local int height = 480

local int paddleHeight = 70
local double speed = -4
local Vector2 ballPosition = new Vector2(width/2, height/2)
local Vector2 playerPosition = new Vector2(30, height/2) // start it in the middle
local Vector2 opPosition = new Vector2(width-60, height/2)
local int pscore = 0
local int oscore = 0

local any difficultyOptions = enums.createEnum(["Easy", "Medium", "Hard"])
local any difficulty = new Enum(difficultyOptions, "Easy") // change difficulty here
local double difficultyValue = -2

switch(difficulty):
  case "Easy":
    difficultyValue = 1.9
    speed = 3
  case "Medium":
    difficultyValue = 3.1
    speed = 4
  case "Hard":
    difficultyValue = 4.4
    speed = 5
end
local Vector2 ballVelocity = new Vector2(speed, speed) // throw it towards the player

game.createWindow(width, height)

function updateBall():
  ballPosition.x += ballVelocity.x
  ballPosition.y += ballVelocity.y
end

game.mainLoop(function():
  game.clear()
  game.background("Black")
  game.fillColor("White")
  
  game.text(pscore + " - " + oscore, width/2, 80, 80, center)
  game.circle(ballPosition.x, ballPosition.y, 25)
  game.rect(playerPosition.x, playerPosition.y, 25, paddleHeight)
  game.rect(opPosition.x, opPosition.y, 25, paddleHeight)
  
  ballPosition.x += ballVelocity.x
  ballPosition.y += ballVelocity.y
  
  // ceil check
  if ballPosition.y <= 0 || ballPosition.y >= height:
    ballVelocity.y *= -1
    updateBall()
  end
  
  // sides check
  if ballPosition.x <= 0 || ballPosition.x >= width:
    if ballPosition.x <= 0:
      oscore++
    else:
      pscore++
    end
    // change score values
    
    ballPosition = new Vector2 (width/2, height/2)
    
    local a = math.round(math.random(0, 1))
    local b = math.round(math.random(0, 1))
    
    ballVelocity.x = speed * if(a == 0): -1 else 1
    ballVelocity.y = speed * if(b == 0): -1 else 1
    updateBall()
  end
  
  if ballPosition.y >= opPosition.y:
    opPosition.y += difficultyValue
  else if ballPosition.y <= opPosition.y:
    opPosition.y -= difficultyValue
  end
  
  local p = playerPosition
  local o = opPosition
  local b = ballPosition
  if game.checkCollision(p.x, p.y, 30, paddleHeight, b.x, b.y, 25, 25) ||
  game.checkCollision(o.x, o.y, 30, paddleHeight, b.x, b.y, 25, 25):
    ballVelocity.x *= -1.15 // slowly add more velocity
    ballVelocity.y *= -1
    ballPosition.x += ballVelocity.x * 2
  end // bounce ball when it hits the player

  if isKeyDown("w") && playerPosition.y >= 0:
    // extra condition prevents player from moving off screen
    playerPosition.y -= 4
  end
  if isKeyDown("s") && playerPosition.y <= height - paddleHeight:
    // this check requires -70 because the collision checks the top of the rectangle
    // not the bottom, so to check bottom you need to offset the collision check
    // by the height of the paddle
    playerPosition.y += 4
  end
end)`,
  },
  {
    label: "Chat Site ⭐️⭐️⭐️",
    code: `include htmlapp
include jsonplus
include http
include io
include math
local username = "Pup001"

function randomUsername():
  local prefixr = math.random(0, 3)
  if prefixr >= 2:
    username = "Pup"
  else if prefixr >= 1:
    username = "Dog"
  else:
    username = "Fox"
  end
  local id = math.round(math.random(0, 999))
  username += id
end

function buildPage():
  local page = <style>
    input {
      width: 100%
    }
  </style>
  local res = http.response(
    "get",
    "http://3.80.8.143:3000/messages"
  )
  for i = 0, jsonplus.length(res) - 1:
    local username = res[i].username
    local message = res[i].message
    page += <b>{{username}}</b>
    page += <p>{{message}}</p>
  end
  page += <input
    id="messageInput"
    placeholder="Enter your message here"
    type="text"
  />
  return page
end
randomUsername()
htmlapp.setTitle("Pupchat")
htmlapp.render(buildPage())

while true:
  if io.isKeyPressed("Enter"):
    local message = getHtmlAttribute(
      "#messageInput",
      "value"
    )
    if message != "":
      http.request(
        "post",
        "http://3.80.8.143:3000/messages",
        {
          username: username,
          message: message
        }
      )
      wait(0.2)
      htmlapp.render(buildPage())
    end
  end
  wait(0.033)
end`,
  },
];
