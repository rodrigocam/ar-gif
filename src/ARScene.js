import CameraParam from './camera_para.dat'

class ARScene extends HTMLElement {

    constructor() {
        super();
        this.htmlMarkers = []
        this.threeMarkers = {}
        this.renderer = {}
        this.croppedRenderer = {}
    }

    connectedCallback() {
        this.htmlMarkers = Array.from(this.children).filter((child) => {
            return child.tagName == "AR-MARKER"
        });

        this.init()

        if (window.ARController && ARController.getUserMediaThreeScene) {
            ARThreeOnLoad()
        }
    }

    init() {
        console.log('AR-GIF version 0.0.4')

        window.ARThreeOnLoad = () => {
            ARController.getUserMediaThreeScene({
                maxARVideoSize: 640,
                cameraParam: CameraParam,
                facingMode: 'environment',

                onSuccess: (arScene, arController, arCamera) => {
                    console.log("Initialized ar-scene")
                    this.registerMarkers(arScene, arController)

                    window.arController = arController;

                    this.renderer = this.createRenderer(arScene, arController)
                    this.renderer.domElement.setAttribute("id", "arCanvas")

                    this.croppedRenderer = document.createElement("canvas")
                    this.croppedRenderer.width = window.innerWidth
                    this.croppedRenderer.height = window.innerHeight

                    if (arController.orientation === 'portrait') {
                        this.croppedRenderer.style.transform = 'rotate(-90deg) translateX(-100%)'
                        this.croppedRenderer.style.transformOrigin = '0 0'
                    }

                    //document.body.appendChild(this.renderer.domElement)
                    document.body.appendChild(this.croppedRenderer)

                    this.resizeWindow()

                    window.addEventListener("resize", this.resizeWindow)
                    window.addEventListener("onorientationchange orientationchange load", this.resizeWindow);

                    let tick = () => {
                        arScene.process()
                        arScene.renderOn(this.renderer)
                        this.drawCroppedImage();
                        this.updateMarkersState(arController)
                        requestAnimationFrame(tick)
                    }
                    tick()
                },
            })
        }
    }

    drawCroppedImage() {
        this.cropCanvas(this.renderer.domElement, this.croppedRenderer, cropParams);
    }

    registerMarkers(arScene, arController) {
        const self = this
        this.htmlMarkers.map((marker) => {
            let single = !marker.mult
            if (single) {
                console.log("Registering marker ", marker.patt)
                arController.loadMarker(marker.patt, (id) => {
                    marker.init(id, arScene, arController)
                    self.threeMarkers[id] = marker
                })
            } else {
                console.log('mult marker')
            }
        })
    }

    updateMarkersState(arController) {
        Object.keys(arController.threePatternMarkers).map((key, index) => {
            let marker = arController.threePatternMarkers[key]
            if (marker.visible) {
                marker.children[0].material.needsUpdate = true
                marker.children[0].material.map.needsUpdate = true
            } else if (marker.markerTracker.inPrevious && !marker.markerTracker.inCurrent) {
                this.threeMarkers[key].gifPlaying = false
            }
        })
    }

    createRenderer(arScene, arController) {
        let renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })

        renderer.setSize(640, 480)

        return renderer;
    }

    resizeWindow() {
        const videoHeight = 480
        const videoWidth = 640
        const videoAspect = videoWidth / videoHeight // Same as 4/3

        const canvas = document.getElementsByTagName("canvas")[0]
        let width, height
        if (window.arController.orientation === 'portrait') {
            width = window.innerHeight
            height = window.innerWidth
        } else {
            width = window.innerWidth
            height = window.innerHeight
        }

        canvas.width = width
        canvas.height = height

        const portrait = ((width / height) < videoAspect)

        let cropSize = {}
        if (window.arController.orientation === 'landscape') {
            //Started on Landscape, Got on portrait
            if (portrait) {
                cropSize.cropY = 0
                cropSize.cropHeight = (width * videoWidth) / height
                cropSize.cropWidth = videoHeight
                cropSize.cropX = videoWidth - cropSize.cropWidth
            } else {
                cropSize.cropX = 0
                cropSize.cropWidth = videoWidth
                cropSize.cropHeight = (height * videoWidth) / width
                cropSize.cropY = videoHeight - cropSize.cropHeight
            }
        } else {

            //Landscape
            if (portrait) {
                cropSize.cropY = 0
                cropSize.cropHeight = videoHeight
                cropSize.cropWidth = (width * videoWidth) / (height * 0.7)
                cropSize.cropX = videoWidth - cropSize.cropWidth
            } else {
                cropSize.cropX = 0
                cropSize.cropWidth = videoWidth
                cropSize.cropHeight = (height * videoWidth) / width
                cropSize.cropY = videoHeight - cropSize.cropHeight
            }
        }

        cropParams = cropSize
    }

    cropCanvas(srcCanvas, targetCanvas, cropParams) {
        var ctx = targetCanvas.getContext('2d');
        //ctx.drawImage(srcCanvas, 0, 0, 640, 480, 0, 0, targetCanvas.width, targetCanvas.height)
        ctx.drawImage(srcCanvas, cropParams.cropX, cropParams.cropY, cropParams.cropWidth, cropParams.cropHeight, 0, 0, targetCanvas.width, targetCanvas.height);
    }

    set arScene(value) {
        this.setAttribute('arScene', value)
    }

    get arScene() {
        return this.getAttribute('arScene')
    }

    set arController(value) {
        this.setAttribute('arController', value)
    }

    get arController() {
        return this.getAttribute('arController')
    }
}
var cropParams = {
    cropX: 0,
    cropWidth: 640,
    cropHeight: 480,
    cropY: 0
}
customElements.define("ar-scene", ARScene)