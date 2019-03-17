
class ARContent extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
    }

    get src() {
        return this.getAttribute('src')
    }

    set src(value) {
        this.setAttribute('src', value)
    }

    get scale() {
        return this.getAttribute('scale')
    }

    set scale(value) {
        return this.setAttribute('scale', value)
    }

    get position() {
        return this.getAttribute('position')
    }

    set position(value) {
        this.setAttribute('position', value)
    }

    get rotation() {
        this.getAttribute('rotation')
    }

    set rotation(value) {
        this.setAttribute('rotation', value)
    }
}

customElements.define("ar-content", ARContent)
