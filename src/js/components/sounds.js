const FARTSOUNDS = [
  'static/sounds/BronxCheer-SoundBible.com-524243477.mp3',
  'static/sounds/DriveByFarting-SoundBible.com-155971633.mp3',
  'static/sounds/QuickFart-SoundBible.com-655578646.mp3',
  'static/sounds/Uuuuuu-Paula-1357936016.mp3',
  'static/sounds/SquishFart-SoundBible.com-115133916.mp3',
]

const EXPLOSIONSOUNDS = [
  'static/sounds/Bomb-SoundBible.com-891110113.mp3',
  'static/sounds/DepthChargeShort-SoundBible.com-1303947570.mp3',
  'static/sounds/Explosion-SoundBible.com-2019248186.mp3',
  'static/sounds/explosion1.mp3',
]

const MISCSOUNDS = [
  'static/sounds/Toilet_Flushing-KevanGC-917782919.mp3',
  'static/sounds/Bunker_Buster_Missle-Mike_Koenig-1405344373.mp3',
]

const CLICKSOUNDS = [
  'static/sounds/click.mp3',
]

const ALERTSOUNDS = [
  'static/sounds/alert.mp3',
]

const YESSOUNDS = [
  'static/sounds/yesss.mp3',
]


const GROUPS = {
  'fart': FARTSOUNDS,
  'explosion': EXPLOSIONSOUNDS,
  'click': CLICKSOUNDS,
  'yes': YESSOUNDS,
  'alert': ALERTSOUNDS,
}

class Sounds {

  constructor() {
    this._previousRandomAudioElement = {}
    this.enabled = true
  }

  preLoadSounds() {
    if (this.enabled) {
      for (let type of Object.keys(GROUPS)) {
        let group = GROUPS[type]
        for (var src of group) {
          let element = document.createElement('audio')
          element.type = 'audio/mpeg'
          element.preload = 'auto'
          element.src = src
          element.dataset['type'] = type
          document.body.appendChild(element)
        }
      }
    }
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  play(type) {
    if (this.enabled) {
      if (GROUPS[type].length === 1) {
        // console.log('PLAY', this._getAudioElement(type));
        this._getAudioElement(type).play()
      } else {
        // console.log('PLAY', this._getRandomAudioElement(type));
        this._getRandomAudioElement(type).play()
      }
    }
  }

  _getRandomAudioElement(type, reattempted = false) {
    let nodes = document.querySelectorAll(`audio[data-type="${type}"]`)
    if (nodes.length < 2) {
      this.preLoadSounds()
      if (!reattempted) {
        return this._getRandomAudioElement(type, true)
      }
      // nodes = document.querySelectorAll(`audio[data-type="${type}"]`)

      // throw new Error(`Not enough sounds for '${type}'`)
    }
    let get = () => {
      return nodes[Math.floor(Math.random() * nodes.length)]
    }
    let node = get()
    if (this._previousRandomAudioElement[type] && this._previousRandomAudioElement[type] == node) {
      // recurse!
      return this._getRandomAudioElement(type)
    }
    this._previousRandomAudioElement[type] = node
    return node
  }

  _getAudioElement(type, reattempted = false) {
    let nodes = document.querySelectorAll(`audio[data-type="${type}"]`)
    if (nodes.length < 1) {
      this.preLoadSounds()
      if (!reattempted) {
        return this._getAudioElement(type, true)
      }
      // nodes = document.querySelectorAll(`audio[data-type="${type}"]`)
      // throw new Error(`No sound for '${type}'`)
    }
    return nodes[0]
  }

}


export default new Sounds()
