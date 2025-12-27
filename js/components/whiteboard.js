/**
 * Whiteboard Component for Eduspace
 * Adapted from Poincareweb - Vanilla JavaScript implementation
 */

class Whiteboard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = '';

        // Tool settings
        this.penColor = '#000000';
        this.penSize = 5;
        this.highlightColor = '#ffff00';
        this.highlightOpacity = 0.3;
        this.highlightSize = 10;
        this.eraserSize = 10;

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupEventListeners();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        // Tool buttons
        document.getElementById('wb-pen-btn')?.addEventListener('click', () => this.selectTool('pen'));
        document.getElementById('wb-highlight-btn')?.addEventListener('click', () => this.selectTool('highlight'));
        document.getElementById('wb-eraser-btn')?.addEventListener('click', () => this.selectTool('eraser'));
        document.getElementById('wb-clear-btn')?.addEventListener('click', () => this.clearCanvas());

        // Canvas drawing
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Pen settings
        document.getElementById('wb-pen-color')?.addEventListener('input', (e) => {
            this.penColor = e.target.value;
        });
        document.getElementById('wb-pen-size')?.addEventListener('input', (e) => {
            this.penSize = e.target.value;
        });

        // Highlight settings
        document.getElementById('wb-highlight-color')?.addEventListener('input', (e) => {
            this.highlightColor = e.target.value;
        });
        document.getElementById('wb-highlight-opacity')?.addEventListener('input', (e) => {
            this.highlightOpacity = e.target.value;
        });
        document.getElementById('wb-highlight-size')?.addEventListener('input', (e) => {
            this.highlightSize = e.target.value;
        });

        // Eraser settings
        const eraserSlider = document.getElementById('wb-eraser-slider');
        const eraserDisplay = document.getElementById('eraser-size-display');
        const eraserCircle = document.getElementById('eraser-size-circle');

        eraserSlider?.addEventListener('input', (e) => {
            this.eraserSize = e.target.value;
            if (eraserDisplay) eraserDisplay.textContent = `Taille: ${this.eraserSize}px`;
            if (eraserCircle) {
                eraserCircle.style.width = `${this.eraserSize}px`;
                eraserCircle.style.height = `${this.eraserSize}px`;
            }
        });

        // Modal close buttons
        document.querySelectorAll('.whiteboard-modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.whiteboard-modal');
                if (modal) modal.classList.remove('show');
            });
        });

        document.getElementById('wb-eraser-close')?.addEventListener('click', () => {
            document.getElementById('wb-eraser-modal')?.classList.remove('show');
        });
    }

    selectTool(tool) {
        this.currentTool = tool;

        // Close all modals
        document.querySelectorAll('.whiteboard-modal').forEach(m => m.classList.remove('show'));
        document.getElementById('wb-eraser-modal')?.classList.remove('show');

        // Open appropriate modal
        if (tool === 'pen') {
            document.getElementById('wb-pen-modal')?.classList.add('show');
        } else if (tool === 'highlight') {
            document.getElementById('wb-highlight-modal')?.classList.add('show');
        } else if (tool === 'eraser') {
            const modal = document.getElementById('wb-eraser-modal');
            if (modal) {
                modal.classList.add('show');
                const slider = document.getElementById('wb-eraser-slider');
                const display = document.getElementById('eraser-size-display');
                const circle = document.getElementById('eraser-size-circle');

                if (slider) slider.value = this.eraserSize;
                if (display) display.textContent = `Taille: ${this.eraserSize}px`;
                if (circle) {
                    circle.style.width = `${this.eraserSize}px`;
                    circle.style.height = `${this.eraserSize}px`;
                }
            }
        }
    }

    startDrawing(e) {
        if (!this.currentTool) return;
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.clientX, e.clientY);
    }

    draw(e) {
        if (!this.isDrawing || !this.currentTool) return;

        if (this.currentTool === 'pen') {
            this.ctx.globalAlpha = 1.0;
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.penColor;
            this.ctx.lineWidth = this.penSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
        } else if (this.currentTool === 'highlight') {
            this.ctx.globalAlpha = this.highlightOpacity;
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.highlightColor;
            this.ctx.lineWidth = this.highlightSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(e.clientX, e.clientY);
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalAlpha = 1.0;
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
            this.ctx.lineWidth = this.eraserSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(e.clientX, e.clientY);
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        this.ctx.closePath();
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    show() {
        document.getElementById('whiteboard-container')?.classList.add('active');
    }

    hide() {
        document.getElementById('whiteboard-container')?.classList.remove('active');
    }
}

// Global instance
let whiteboardInstance = null;

function initWhiteboard() {
    if (!whiteboardInstance) {
        whiteboardInstance = new Whiteboard('whiteboard-canvas');
    }
    whiteboardInstance.show();
}

function closeWhiteboard() {
    if (whiteboardInstance) {
        whiteboardInstance.hide();
    }
}

// Toggle toolbar visibility
document.getElementById('toggle-whiteboard-tools')?.addEventListener('click', () => {
    document.getElementById('whiteboard-tools')?.classList.toggle('hidden');
});
