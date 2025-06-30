// Utility to preload images and sounds for the game

const imageList = [
  require('../images/AadumPuliBG.png'),
  require('../images/Board.png'),
  require('../images/closeButton.png'),
  require('../images/Empty.png'),
  require('../images/Goat.png'),
  require('../images/Help Button.png'),
  require('../images/Help_Page.jpg'),
  require('../images/help.png'),
  require('../images/helper.gif'),
  require('../images/LandingPage.jpg'),
  require('../images/mute.png'),
  require('../images/playButton.gif'),
  require('../images/soundOn.png'),
  require('../images/strip.png'),
  require('../images/Tiger.png'),
  require('../images/timer.png'),
];

const soundList = [
  require('../sounds/bg.wav'),
  require('../sounds/cheers.mp3'),
  require('../sounds/GameBG 14.mp3'),
  require('../sounds/goat_blead.mp3'),
  require('../sounds/match.mp3'),
  require('../sounds/oops.mp3'),
  require('../sounds/promote.mp3'),
  require('../sounds/switch.mp3'),
  require('../sounds/ticktick.mp3'),
];

export function preloadImages() {
  imageList.forEach(src => {
    const img = new window.Image();
    img.src = src;
  });
}

export function preloadSounds() {
  soundList.forEach(src => {
    const audio = new window.Audio();
    audio.src = src;
  });
} 