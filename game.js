const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const chat_input = document.getElementById("chat-input")
const chat_text = document.getElementById("chat-text")

let line_width = 15
let color = "#000"

let prevX = null
let prevY = null

let draw = false

let canvas_size_ratio = null

// Set variables that depend on viewport size
function calculate_viewport_size_dependant_things() {
  canvas_size_ratio = canvas.scrollHeight / canvas.height

  let balls = document.querySelectorAll(".size-ball")
  balls = Array.from(balls)
  balls.forEach(ball => {
    ball.style.height = (ball.dataset.size * canvas_size_ratio).toString() + "px"
  })
}

calculate_viewport_size_dependant_things()

window.addEventListener("resize", () => {
  calculate_viewport_size_dependant_things()
})

// Buttons for changing colour
let clrs = document.querySelectorAll(".clr")
clrs = Array.from(clrs)
clrs.forEach(clr => {
  clr.addEventListener("click", () => {
    color = clr.dataset.clr
  })
  clr.style.backgroundColor = clr.dataset.clr
})

// Buttons for changing brush size
let sizs = document.querySelectorAll(".size")
sizs = Array.from(sizs)
sizs.forEach(siz => {
  siz.addEventListener("click", () => {
    line_width = siz.firstElementChild.dataset.size
  })
})

// Clearing canvas
let clearBtn = document.getElementById("clear")
clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
})

// Saving drawing as image
let saveBtn = document.getElementById("save")
saveBtn.addEventListener("click", () => {
  let data = canvas.toDataURL("imag/png")
  let a = document.createElement("a")
  a.href = data
  a.download = "scribbly.png"
  a.click()
})

// Drawing on canvas
window.addEventListener("mousedown", (e) => {
  if (e.buttons === 1) draw = true
})
window.addEventListener("mouseup", (e) => {
  if (e.buttons === 0) draw = false
})

canvas.addEventListener("mousemove", (e) => {
  let rect = e.target.getBoundingClientRect();

  let currentX = (e.clientX - rect.left) / canvas_size_ratio
  let currentY = (e.clientY - rect.top) / canvas_size_ratio

  if (prevX == null || prevY == null || !draw) {
    prevX = currentX
    prevY = currentY
    return
  }

  ctx.lineWidth = line_width
  ctx.strokeStyle = color
  ctx.fillStyle = color

  ctx.beginPath()
  ctx.arc(currentX, currentY, line_width / 2.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(prevX, prevY)
  ctx.lineTo(currentX, currentY)
  ctx.stroke()

  prevX = currentX
  prevY = currentY
})

canvas.addEventListener("touchmove", (evt) => {
  evt.preventDefault();
  var touches = evt.changedTouches;

  for (var i = 0; i < touches.length; i++) {
    var idx = ongoingTouchIndexById(touches[i].identifier);

    if (idx >= 0) {
      ctx.beginPath();
      ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
      ctx.lineTo(touches[i].pageX, touches[i].pageY);
      ctx.lineWidth = line_width;
      ctx.strokeStyle = color;
      ctx.stroke();

      ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
    } else {
      console.log("can't figure out which touch to continue");
    }
  }
})

// Sending messages in chat
function add_text_to_chat(author, text) {
  let author_corrected = author.toLowerCase()
  author_corrected = author_corrected.charAt(0).toUpperCase() + author_corrected.slice(1)
  let temp = "<span>" + author_corrected + ":</span> " + text + "<br>"
  chat_text.innerHTML += temp
}

chat_input.addEventListener("keypress", (e) => {
  if (e.key === 'Enter') {
    add_text_to_chat("me", chat_input.value)
    chat_input.value = ""
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