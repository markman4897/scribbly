
let radio = document.getElementById('radio')
let icon = document.getElementById('radio-button-icon')

radio.volume = 0.1

function radioToggle() {
  if (radio.paused) {
    radio.play()
    icon.classList.remove('fas')
    icon.classList.add('far')
  } else {
    radio.pause()
    icon.classList.remove('far')
    icon.classList.add('fas')
  }
}