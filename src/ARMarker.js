import {} from './vendor/gifler.min.js'

class ARMarker extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        this.textureCanvas = document.createElement('canvas')
        this.gifPlaying = false
        this.gifLoaded = false

        if(this.content) {
            this.contentProps = {
                src: this.content,
                scale: {x: 1, y: 1, z: 1},
                position: {x: 0, y: 0, z: 0},
                rotation: {x: 0, y: 0, z: 0},
                loop: 0,
                audio: 0,
            }
        }else {
            // case where the content was specified as ar-content
            let arContent = this.children[0]
            this.contentProps = {
                src: arContent.getAttribute('src'),
                scale: this.stringToVec3(arContent.getAttribute('scale')),
                position: this.stringToVec3(arContent.getAttribute('position')),
                rotation: this.stringToVec3(arContent.getAttribute('rotation')),
                loop: arContent.getAttribute('loop'),
                audio: arContent.getAttribute('audio')
            }
        }
    }

    init(markerId, arScene, arController) {
        this.markerId = markerId
        this.textureCanvas.setAttribute('id', markerId)

        let texture = new THREE.CanvasTexture(this.textureCanvas)
        this.material = new THREE.MeshBasicMaterial({map: texture, transparent: true});

        let threeMarker = this.create3DMarker(markerId, arController);
        arScene.scene.add(threeMarker);

        let content_ext = this.contentProps.src.split(".")[1];

        if(content_ext == "gif"){
            this.contentIsGif = true;
        }else if(content_ext == "png" || content_ext == "jpg" || content_ext == "jpeg"){
            this.contentIsImage = true;
            this.image = document.createElement("img");
            this.image.src = this.contentProps.src;
        }else{
            this.video = document.createElement("video");
            this.video.src = this.contentProps.src;

            this.video.loop = true;
            if(this.contentProps.loop == 0)
            {
                this.video.loop = false;
            }

            this.video.muted = true;
            if(this.contentProps.audio == 1)
            {
                this.video.muted = false;
            }
        }

        const self = this

        arController.addEventListener('getMarker', (ev) => {
            // supress wanings
            console.warn = function(){}
            if(ev.data.marker.id == markerId && self.contentIsGif) {
                if(!self.gifLoaded) {
                    self.gif = gifler(self.contentProps.src).animate(self.textureCanvas)
                    self.gifLoaded = true;
                }
                self.gifPlaying = true
                texture.needsUpdate = true
            } else if (self.contentIsImage){
                let ctx = self.textureCanvas.getContext('2d');
                ctx.clearRect(0, 0, self.textureCanvas.width, self.textureCanvas.height);
                ctx.drawImage(self.image, 0, 0, self.textureCanvas.width, self.textureCanvas.height);

            } else if(ev.data.marker.id == markerId) {
                if(self.video.ended != 0 && self.contentProps.loop == 0)
                {
                    return;
                }
                self.video.play();
                (function loop() {
                    let ctx = self.textureCanvas.getContext('2d');
                    if (!self.video.paused && !self.video.ended) {
                        ctx.clearRect(0,0, self.textureCanvas.width, self.textureCanvas.height);
                        ctx.drawImage(self.video, 0, 0, self.textureCanvas.width, self.textureCanvas.height);
                        texture.needsUpdate = true;
                        setTimeout(loop, 1000 / 30); // drawing at 30fps
                    }
                })();
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
        let plane = new THREE.Mesh(geometry, this.material)
        let props = this.contentProps

        // needed to apply content properties
        plane.scale.set(props.scale.x, props.scale.y, props.scale.z)
        plane.position.set(props.position.x, props.position.y, props.position.z)
        plane.rotation.set(props.rotation.x, props.rotation.y, props.rotation.z)

        return plane
    }

    // converts a string in the format "1 1 1" to an object like {x: 1, y: 1, z: 1}
    stringToVec3(str) {
        let split = str.split(" ")

        return {
            x: split[0] || 0,
            y: split[1] || 0,
            z: split[2] || 0
        }
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
