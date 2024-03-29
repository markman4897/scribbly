const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const chat_input = document.getElementById("chat-input");
const chat_text = document.getElementById("chat-text");
const eraser_btn = document.getElementById("eraser");

ctx.lineJoin = "round";
ctx.lineCap = "round";

let line_width = 15;
let color = "#000";
let canvas_color = "#000";

var drawing_history = new Array();
var drawing_history_pointer = -1;

class Tool {
  static pen = new Tool("pen");
  static fill = new Tool("fill");

  constructor(name) {
    this.name = name;
  }
}

let tool = Tool.pen;
let erase = false;
let fill_brush_path_points = [];

let prevMouse = {};
let prevTouch = {};

let drawing = false;
let ongoingTouches = [];

let canvas_size_ratio = null;

// INITIALISING
// window.addEventListener('DOMContentLoaded', (e) => {  // fires when dom is loaded but before CSS etc is loaded
window.onload = (e) => {
  // fires when everything is loaded
  calculate_viewport_size_dependant_things();
  canvas_color = window.getComputedStyle(canvas).backgroundColor;
  clear();

  set_selected_tool("pen");
  set_selected_size(15);
};

// DISABLING ACCIDENTAL UNLOAD
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
});

// SETTING VARIABLES DEPENDANT ON VIEWPORT SIZE
function calculate_viewport_size_dependant_things() {
  // this is a HACK! rewrite in css if possible or upgrade this code so it doesn't push down chat
  // (replace canvas container with something else that still limits canvas width)
  let main_style = getComputedStyle(document.getElementsByTagName("main")[0]);
  let footer = document
    .getElementsByTagName("footer")[0]
    .getBoundingClientRect();
  let controlls = document.getElementById("controlls").getBoundingClientRect();
  let max_canvas_size =
    footer.top - controlls.bottom - main_style.marginBottom.replace("px", "");
  document.documentElement.style.setProperty(
    "--max-canvas-height",
    max_canvas_size + "px"
  );

  canvas_size_ratio = canvas.scrollHeight / canvas.height;

  let balls = document.querySelectorAll(".size-ball");
  balls = Array.from(balls);
  balls.forEach((ball) => {
    ball.style.height =
      (ball.dataset.size * canvas_size_ratio).toString() + "px";
  });
}

window.addEventListener("resize", calculate_viewport_size_dependant_things);
window.addEventListener(
  "orientationchange",
  calculate_viewport_size_dependant_things
);

// MAPPING BUTTONS

function set_color(clr) {
  color = clr;
  color_size_balls(clr);
}

// Buttons for changing colour
let clrs = document.querySelectorAll(".clr");
clrs = Array.from(clrs);
clrs.forEach((clr) => {
  clr.addEventListener("click", () => {
    set_color(clr.dataset.clr);
  });
  clr.style.backgroundColor = clr.dataset.clr;
});

// Set selected tool
function set_selected_tool(tool_id) {
  let tools = document.getElementById("tools").children;

  Array.from(tools).forEach((tool) => {
    if (tool.classList.contains("button-pressed"))
      tool.classList.remove("button-pressed");
  });

  document.getElementById(tool_id).classList.add("button-pressed");
}

// Set selected tool
function set_selected_size(data_size) {
  let sizes = document.getElementById("sizes").children;

  Array.from(sizes).forEach((size) => {
    if (size.classList.contains("button-pressed"))
      size.classList.remove("button-pressed");

    let temp = size.children[0].getAttribute("data-size");
    if (temp == data_size) size.classList.add("button-pressed");
  });
}

// Pen
function set_pen() {
  tool = Tool.pen;
  set_selected_tool("pen");
}

// Fill brush
function set_fill() {
  tool = Tool.fill;
  set_selected_tool("fill-brush");
}

// Eraser
function set_eraser() {
  erase = !erase;

  if (erase) {
    eraser_btn.classList.add("button-pressed");
  } else {
    eraser_btn.classList.remove("button-pressed");
  }
}

// Setting size balls to selected colour
let size_balls = document.querySelectorAll(".size-ball");
function color_size_balls(color) {
  size_balls.forEach((ball) => {
    ball.style.backgroundColor = color;
  });
}

// Buttons for changing brush size
let sizs = document.querySelectorAll(".size");
sizs.forEach((siz) => {
  siz.addEventListener("click", () => {
    let size = siz.firstElementChild.dataset.size;
    line_width = size;
    set_selected_size(size);
  });
});

// Clearing canvas
function fix_me() {
  console.log("figure out why this is needed! (game.js)");
  clear();
}

function clear() {
  ctx.fillStyle = canvas_color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawing_history_push();
}

// Saving drawing as image
function save() {
  let data = canvas.toDataURL("imag/png");
  let a = document.createElement("a");
  a.href = data;
  a.download = "scribbly.png";
  a.click();
}

// DRAWING ON CANVAS

// common functions
function draw_circle(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, line_width / 2, 0, Math.PI * 2);
  ctx.fill();
}

function draw_line(a, b) {
  ctx.lineWidth = line_width;

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function draw_pen(a, b) {
  draw_line(a, b);
}

function draw_fill_brush(a, b) {
  fill_brush_path_points.push(b);

  let temp = Array.from(fill_brush_path_points);

  ctx.beginPath();
  ctx.moveTo(temp[0].x, temp[0].y);

  temp.shift();
  temp.forEach((p) => {
    ctx.lineTo(p.x, p.y);
  });

  ctx.closePath();
  ctx.fill();
}

function draw(a, b) {
  if (state == states.game.guessing) return;

  if (erase) {
    ctx.fillStyle = canvas_color;
    ctx.strokeStyle = canvas_color;
  } else {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
  }

  switch (tool) {
    case Tool.pen:
      draw_pen(a, b);
      break;
    case Tool.fill:
      draw_fill_brush(a, b);
      break;
  }
}

function calibrate_position(x, y) {
  let out = {};
  let rect = canvas.getBoundingClientRect();

  out.x = (x - rect.left) / canvas_size_ratio;
  out.y = (y - rect.top) / canvas_size_ratio;

  return out;
}

// mouse functions
function getCurrentMousePos(e) {
  let currentPos = calibrate_position(e.clientX, e.clientY);
  return currentPos;
}

function mouse_draw(e) {
  let currentPos = getCurrentMousePos(e);

  if (!(prevMouse.x == null || prevMouse.y == null || !drawing)) {
    draw(prevMouse, currentPos);
  }

  prevMouse = currentPos;
}

canvas.addEventListener("mousedown", (e) => {
  if (e.buttons === 1) {
    drawing = true;
    mouse_draw(e);
  }
});

window.addEventListener("mousemove", mouse_draw);

window.addEventListener("mouseup", (e) => {
  if (e.buttons === 0) {
    if (drawing) {
      fill_brush_path_points = [];
      drawing_history_push();
    }

    drawing = false;
  }
});

// touch functions
function getCurrentTouchPos(e) {
  let currentPos = calibrate_position(e.pageX, e.pageY);
  return currentPos;
}

function touch_draw(e) {
  let currentPos = getCurrentTouchPos(e);

  draw(prevTouch, currentPos);

  prevTouch = currentPos;
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
  drawing = true;
  e.preventDefault();
  let touches = e.changedTouches;
  let currentPos = getCurrentTouchPos(e);

  prevTouch = currentPos;

  for (let i = 0; i < touches.length; i++) {
    ongoingTouches.push(touches[i]);
    touch_draw(touches[i]);
  }
});

window.addEventListener("touchmove", (e) => {
  let touches = e.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    let idx = ongoingTouchIndexById(touches[i].identifier);

    if (idx >= 0) {
      touch_draw(touches[i]);

      ongoingTouches.splice(idx, 1, touches[i]);
    }
  }
});

window.addEventListener("touchend", (e) => {
  let touches = e.changedTouches;

  for (let i = 0; i < touches.length; i++) {
    let idx = ongoingTouchIndexById(touches[i].identifier);
    if (idx >= 0) {
      ongoingTouches.splice(idx, 1);
    }
  }

  if (drawing) {
    drawing_history_push();
    fill_brush_path_points = [];
  }

  drawing = false;
});

// UNDO/REDO

function drawing_history_push() {
  drawing_history_pointer++;

  if (drawing_history_pointer < drawing_history.length)
    drawing_history.length = drawing_history_pointer;

  let data = canvas.toDataURL();
  drawing_history.push(data);
  if (room_id) send_draw_state(data);
}

function undo() {
  if (drawing_history_pointer > 0) {
    drawing_history_pointer--;
    redraw_canvas(drawing_history[drawing_history_pointer]);
  }
}

function redo() {
  if (drawing_history_pointer < drawing_history.length - 1) {
    drawing_history_pointer++;
    redraw_canvas(drawing_history[drawing_history_pointer]);
  }
}

function redraw_canvas(data) {
  var canvasPic = new Image();
  canvasPic.src = data;

  canvasPic.onload = () => {
    ctx.drawImage(canvasPic, 0, 0);
  };
}

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

/* MULTIPLAYER PART */

let username = null;
let user_id = null;
let room_id = null;
let state = null;

const states = {
  drawing: 0,
  game: {
    drawing: 1,
    guessing: 2,
  },
};

const random_names = [
  "jolly",
  "silly",
  "grumpy",
  "itchy",
  "sappy",
  "sloppy",
  "fancy",
  "scary",
  "witty",
  "lively",
  "teeny",
  "scruffy",
  "angry",
  "lovely",
  "funny",
  "boss",
];

let ping = null;

username = random_names[Math.floor(Math.random() * random_names.length)];

function get_host() {
  let params = new URLSearchParams(document.location.search);
  if (params.has("HOST")) {
    let host_p = params.get("HOST");
    if (host_p == "localhost") {
      return "ws:localhost:3000";
    } else {
      return host_p;
    }
  }

  return "wss://scribblio.herokuapp.com/";
}
const HOST = get_host();

let ws = new WebSocket(HOST);

const lobby = document.getElementById("lobby");
const lobby_2 = document.getElementById("lobby-2");
const lobby_input = document.getElementById("room_id");
const word = document.getElementById("word");
const room_id_display = document.getElementById("room_id_display");
/* const username_input = document.getElementById("username"); */

function err(text) {
  add_text_to_chat("ERROR!", text);
}

ws.onopen = (e) => {
  get_user_id();

  ping = setInterval(() => {
    ws.send(
      JSON.stringify({
        type: "ping",
        user_id: user_id,
      })
    );
  }, 20000);

  if (get_room_id_from_params()) {
    console.log("ran join room func");
    join_room();
  }
};

ws.onmessage = (message) => {
  let data = JSON.parse(message.data);

  if (data.error) {
    err(data);
    console.log("data contains error:", data);
  }

  switch (data.type) {
    case "new_user_created":
      user_id = data.user_id;

      if (room_id) join_room();
      break;

    case "new_room_created":
      room_id = data.room_id;
      room_id_display.innerHTML = room_id;
      push_history(room_id);
      state = states.game.drawing;
      toggle_lobby(false);
      toggle_lobby_2(true);
      break;

    case "room_joined":
      room_id = data.room_id;
      room_id_display.innerHTML = room_id;
      push_history(room_id);
      state = states.game.guessing;
      toggle_lobby(false);
      receive_draw_state(data.state);
      break;

    case "message":
      add_text_to_chat(data.username, data.message);
      break;

    case "new_draw_state":
      receive_draw_state(data.state);
      break;

    case "word_guessed":
      add_text_to_chat("victory!", "You guessed the correct word!");
      break;

    case "youre_new_drawer":
      add_text_to_chat("System", "You're the new drawer.");
      clear();
      toggle_lobby_2(true);
      state = states.game.drawing;
      break;

    case "error":
      err(data.message);
      console.log("error message:", data.message);
      break;

    default:
      err("unknown type received");
      break;
  }
};

ws.onclose = (e) => {
  clearInterval(ping);
  room_id_display.innerHTML = "";
};

function toggle_lobby(state = null) {
  if (state !== null) {
    if (state) {
      lobby.style.display = "flex";
    } else {
      lobby.style.display = "none";
    }
  } else {
    if (lobby.style.display == "none") {
      lobby.style.display = "flex";
    } else {
      lobby.style.display = "none";
    }
  }
}

function toggle_lobby_2(state = null) {
  if (state !== null) {
    if (state) {
      lobby_2.style.display = "block";
    } else {
      lobby_2.style.display = "none";
    }
  } else {
    if (lobby_2.style.display == "none") {
      lobby_2.style.display = "block";
    } else {
      lobby_2.style.display = "none";
    }
  }
}

function get_room_id_from_params() {
  let params = new URLSearchParams(document.location.search);
  return params.get("room_id");
}

function just_drawing() {
  state = states.drawing;
  toggle_lobby(false);
}

function get_user_id() {
  ws.send(
    JSON.stringify({
      type: "new_user",
      /* username: username_input.value || "test_user", */
      username: username,
    })
  );
}

function new_room() {
  ws.send(
    JSON.stringify({
      type: "new_room",
      user_id: user_id,
    })
  );
}

function join_room() {
  let params_room_id = get_room_id_from_params();

  ws.send(
    JSON.stringify({
      type: "join_room",
      user_id: user_id,
      room_id: lobby_input.value || params_room_id,
    })
  );
}

function send_draw_state(state) {
  ws.send(
    JSON.stringify({
      type: "new_draw_state",
      user_id: user_id,
      room_id: room_id,
      state: state,
    })
  );
}

function receive_draw_state(state) {
  redraw_canvas(state);
}

function select_word() {
  ws.send(
    JSON.stringify({
      type: "new_word_selected",
      user_id: user_id,
      room_id: room_id,
      word: word.value,
    })
  );

  word.value = "";
}

function switch_drawer(next_drawer_id) {
  ws.send(
    JSON.stringify({
      type: "switch_drawer",
      user_id: user_id,
      /* next_drawer_id: next_drawer_id, */
    })
  );
  toggle_lobby_2(false);
  state = states.game.guessing;
}

function push_history(room_id) {
  const url = new URL(window.location);
  url.searchParams.set("room_id", room_id);
  window.history.pushState({}, "", url);
}

// CHAT HANDLING
function add_text_to_chat(author, text) {
  let author_corrected = author.toLowerCase();
  author_corrected =
    author_corrected.charAt(0).toUpperCase() + author_corrected.slice(1);
  let temp = "<span>" + author_corrected + ":</span> " + text + "<br>";
  chat_text.innerHTML = temp + chat_text.innerHTML;
}

function send_input_message() {
  if (chat_input.value != "") {
    add_text_to_chat("me", chat_input.value);
    ws.send(
      JSON.stringify({
        type: "message",
        user_id: user_id,
        message: chat_input.value,
      })
    );
    chat_input.value = "";
  }
}

chat_input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    send_input_message();
  }
});
