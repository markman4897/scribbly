const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const chat_input = document.getElementById("chat-input")
const chat_text = document.getElementById("chat-text")

let line_width = 15
let color = "#000"
let canvas_color = '#000'

let prevMouse = {}
let prevTouch = {}

let drawing = false
let ongoingTouches = []

let canvas_size_ratio = null

// INITIALISING
// window.addEventListener('DOMContentLoaded', (e) => {  // fires when dom is loaded but before CSS etc is loaded
window.onload = (e) => { // fires when everything is loaded
  calculate_viewport_size_dependant_things()
  canvas_color = window.getComputedStyle(canvas).backgroundColor
  clear()
};


// SETTING VARIABLES DEPENDANT ON VIEWPORT SIZE
function calculate_viewport_size_dependant_things() {
  // this is a HACK! rewrite in css if possible or upgrade this code so it doesn't push down chat
  // (replace canvas container with something else that still limits canvas width)
  let main_style = getComputedStyle(document.getElementsByTagName('main')[0])
  let footer = document.getElementsByTagName('footer')[0].getBoundingClientRect()
  let controlls = document.getElementById('controlls').getBoundingClientRect()
  let max_canvas_size = footer.top - controlls.bottom - main_style.marginBottom.replace("px", "")
  document.documentElement.style.setProperty('--max-canvas-height', max_canvas_size + 'px');

  canvas_size_ratio = canvas.scrollHeight / canvas.height

  let balls = document.querySelectorAll(".size-ball")
  balls = Array.from(balls)
  balls.forEach(ball => {
    ball.style.height = (ball.dataset.size * canvas_size_ratio).toString() + "px"
  })
}

window.addEventListener("resize", calculate_viewport_size_dependant_things)
window.addEventListener("orientationchange", calculate_viewport_size_dependant_things)


// MAPPING BUTTONS

function set_color(clr) {
  color = clr
  color_size_balls(clr)
}

// Buttons for changing colour
let clrs = document.querySelectorAll(".clr")
clrs = Array.from(clrs)
clrs.forEach(clr => {
  clr.addEventListener("click", () => {
    set_color(clr.dataset.clr)
  })
  clr.style.backgroundColor = clr.dataset.clr
})

// Eraser
function set_eraser() {
  set_color(canvas_color)
}

// Setting size balls to selected colour
let size_balls = document.querySelectorAll(".size-ball")
function color_size_balls(color) {
  size_balls.forEach(ball => {
    ball.style.backgroundColor = color
  })
}

// Buttons for changing brush size
let sizs = document.querySelectorAll(".size")
sizs.forEach(siz => {
  siz.addEventListener("click", () => {
    line_width = siz.firstElementChild.dataset.size
  })
})

// Clearing canvas
function fix_me() {
  console.log("figure out why this is needed! (game.js)")
  clear()
}

function clear() {
  ctx.fillStyle = canvas_color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

// Saving drawing as image
function save() {
  let data = canvas.toDataURL("imag/png")
  let a = document.createElement("a")
  a.href = data
  a.download = "scribbly.png"
  a.click()
}


// DRAWING ON CANVAS

// common functions
function draw_circle(x, y) {
  ctx.fillStyle = color

  ctx.beginPath()
  ctx.arc(x, y, line_width / 2, 0, Math.PI * 2)
  ctx.fill()
}

function draw_line(a, b) {
  ctx.lineWidth = line_width
  ctx.strokeStyle = color

  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

function draw(a, b) {
  draw_circle(b.x, b.y)
  draw_line(a, b)
}

function calibrate_position(x, y) {
  let out = {}
  let rect = canvas.getBoundingClientRect();

  out.x = (x - rect.left) / canvas_size_ratio
  out.y = (y - rect.top) / canvas_size_ratio

  return out
}

// mouse functions
function getCurrentMousePos(e) {
  let currentPos = calibrate_position(e.clientX, e.clientY);
  return currentPos
}

function mouse_draw(e) {
  let currentPos = getCurrentMousePos(e)

  if (!(prevMouse.x == null || prevMouse.y == null || !drawing)) {
    draw(prevMouse, currentPos)
  }

  prevMouse = currentPos
}

canvas.addEventListener("mousedown", (e) => {
  if (e.buttons === 1) {
    drawing = true
    mouse_draw(e)
  }
})

window.addEventListener("mousemove", mouse_draw)

window.addEventListener("mouseup", (e) => {
  if (e.buttons === 0) drawing = false
})

// touch functions
function getCurrentTouchPos(e) {
  let currentPos = calibrate_position(e.pageX, e.pageY);
  return currentPos
}

function touch_draw(e) {
  let currentPos = getCurrentTouchPos(e)

  draw(prevTouch, currentPos)

  prevTouch = currentPos
}

function ongoingTouchIndexById(idToFind) {
  for (let i = 0; i < ongoingTouches.length; i++) {
    let id = ongoingTouches[i].identifier;

    if (id == idToFind) {
      return i;
    }
  }
  return -1;
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault()
  let touches = e.changedTouches;
  let currentPos = getCurrentTouchPos(e)

  prevTouch = currentPos

  for (let i = 0; i < touches.length; i++) {
    ongoingTouches.push(touches[i]);
    touch_draw(touches[i])
  }
})

window.addEventListener("touchmove", (e) => {
  let touches = e.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    let idx = ongoingTouchIndexById(touches[i].identifier);

    if (idx >= 0) {
      touch_draw(touches[i])

      ongoingTouches.splice(idx, 1, touches[i])
    }
  }
})

window.addEventListener("touchend", (e) => {
  let touches = e.changedTouches

  for (let i = 0; i < touches.length; i++) {
    let idx = ongoingTouchIndexById(touches[i].identifier);
    if (idx >= 0) {
      ongoingTouches.splice(idx, 1)
    }
  }
})


// CHAT HANDLING
function add_text_to_chat(author, text) {
  let author_corrected = author.toLowerCase()
  author_corrected = author_corrected.charAt(0).toUpperCase() + author_corrected.slice(1)
  let temp = "<span>" + author_corrected + ":</span> " + text + "<br>"
  chat_text.innerHTML += temp
}

function send_input_to_chat() {
  if (chat_input.value != "") {
    add_text_to_chat("me", chat_input.value)
    chat_input.value = ""
  }
}

chat_input.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    send_input_to_chat()
  }
})

/*
          <div class="clr" data-clr="#000000"></div>
          <div class="clr" data-clr="#00FFFF"></div>
          <div class="clr" data-clr="#0000FF"></div>
          <div class="clr" data-clr="#FF00FF"></div>
          <div class="clr" data-clr="#808080"></div>
          <div class="clr" data-clr="#008000"></div>
          <div class="clr" data-clr="#00FF00"></div>
          <div class="clr" data-clr="#800000"></div>
        </div>
        <div class="colors-row">
          <div class="clr" data-clr="#000080"></div>
          <div class="clr" data-clr="#808000"></div>
          <div class="clr" data-clr="#800080"></div>
          <div class="clr" data-clr="#FF0000"></div>
          <div class="clr" data-clr="#C0C0C0"></div>
          <div class="clr" data-clr="#008080"></div>
          <div class="clr" data-clr="#FFFF00"></div>
          <div class="clr" data-clr="#FFFFFF"></div>
          */