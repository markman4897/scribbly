let container = document.getElementById('footer-random-quote')

let quotes = [
  "Been around since 1997",
  "Why not try the radio button on top right",
  "Good morning, afternoon or evening",
  "Why not just relax and draw a picture",
  "If you want to learn how this works, check out the source code",
  "Try drawing something nice",
]

let quote_interval = window.setInterval(change_quote, 30000)

function change_quote() {
  container.classList.add('transparent')
}



container.addEventListener("transitionend", (e) => {
  if (container.classList.contains('transparent')) {
    let randQuote = quotes[Math.floor(Math.random() * quotes.length)]
    container.innerText = randQuote
    container.classList.remove('transparent')
  }
})