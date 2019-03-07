import {} from './vendor/gifler.min.js'

class ARMarker extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        this.textureCanvas = document.createElement('canvas')
        this.gifPlaying = false
        this.gifLoaded = false
    }

    init(markerId, arScene, arController) {
        this.markerId = markerId
        this.textureCanvas.setAttribute('id', markerId)

        let texture = new THREE.CanvasTexture(this.textureCanvas)
        this.material = new THREE.MeshBasicMaterial({map: texture, transparent: true});

        let threeMarker = this.create3DMarker(markerId, arController)
        arScene.scene.add(threeMarker)
        const self = this
        
        arController.addEventListener('getMarker', (ev) => {
            // supress wanings
            console.warn = function(){}
            if(ev.data.marker.id == markerId) {
                if(!self.gifLoaded) {
                    self.gif = gifler(self.content).animate(self.textureCanvas)
                    self.gifLoaded = true;
                }
                self.gifPlaying = true
                texture.needsUpdate = true
            }
        })
        console.log("Initialized marker ", markerId, this.textureCanvas)
    }

    get3DMarker(markerId, arScene) {
        let arController = arScene.arController;
        return arController.threePatternMarkers[markerId];
    }

    create3DMarker(markerId, arController) {
        let threeMarker = arController.createThreeMarker(markerId)
        let plane = this.create3DPlane()

        threeMarker.add(plane)
        return threeMarker
    }

    create3DPlane() {
        let geometry = new THREE.PlaneGeometry()
        return new THREE.Mesh(geometry, this.material)
    }

    static get observedAttributes() {
        return ['gif-playing']
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case 'gif-playing':
                if(oldValue == 'true' && newValue == 'false') {
                    this.gif.then((animator) => {
                        animator.stop()
                    })
                }else if(oldValue == 'false' && newValue == 'true') {
                    this.gif.then((animator) => {
                        animator.reset()
                        animator.start()
                    })
                }
                break;
        }
    }

    set markerId(value) {
        this.setAttribute('marker-id', value)
    }

    get markerId() {
        return this.getAttribute('marker-id')
    }

    set canvasTexture(value) {
        this.setAttribute('canvas-texture', value)
    }

    get canvasTexture() {
        this.getAttribute('canvas-texture')
    }

    set gifPlaying(value) {
        this.setAttribute('gif-playing', value)
    }

    get gifPlaying() {
        return this.getAttribute('gif-playing')
    }

    set patt(value) {
        this.setAttribute('patt', value)
    }

    get patt() {
        return this.getAttribute('patt')
    }

    set content(value) {
        this.setAttribute('content', value)
    }

    get content() {
        return this.getAttribute('content')
    }

    set mult(value) {
        this.setAttribute('mult', value)
    }

    get mult() {
        return this.hasAttribute('mult')
    }

}
customElements.define("ar-marker", ARMarker)
