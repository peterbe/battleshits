const FARTSOUNDS = [
  'static/sounds/BronxCheer-SoundBible.com-524243477.mp3',
  'static/sounds/DriveByFarting-SoundBible.com-155971633.mp3',
  'static/sounds/QuickFart-SoundBible.com-655578646.mp3',
  'static/sounds/Uuuuuu-Paula-1357936016.mp3',
]

const EXPLOSIONSOUNDS = [
  'static/sounds/Bomb-SoundBible.com-891110113.mp3',
  'static/sounds/DepthChargeShort-SoundBible.com-1303947570.mp3',
  'static/sounds/Explosion-SoundBible.com-2019248186.mp3',
]

const MISCSOUNDS = [
  'static/sounds/Toilet_Flushing-KevanGC-917782919.mp3',
  'static/sounds/Bunker_Buster_Missle-Mike_Koenig-1405344373.mp3',
]


class Sounds {

  constructor() {
    this.previousRandomAudioElement = {}
  }

  preLoadSounds() {
    let pairs = [['fart', FARTSOUNDS], ['explosion', EXPLOSIONSOUNDS]]
    for (var pair of pairs) {
      let group = pair[1]
      let cls = pair[0]
      for (var src of group) {
        let element = document.createElement('audio')
        element.type = 'audio/mpeg'
        element.preload = 'auto'
        element.src = src
        element.dataset['type'] = cls
        document.body.appendChild(element)
      }
    }
  }

  getRandomAudioElement(type) {
    let nodes = document.querySelectorAll(`audio[data-type="${type}"]`)
    if (nodes.length < 2) {
      throw new Error(`Not enough sounds for '${type}'`)
    }
    let get = () => {
      return nodes[Math.floor(Math.random() * nodes.length)]
    }
    let node = get()
    if (this.previousRandomAudioElement[type] && this.previousRandomAudioElement[type] == node) {
      // recurse!
      return this.getRandomAudioElement(type)
    }
    this.previousRandomAudioElement[type] = node
    return node
  }

}


export default new Sounds()
