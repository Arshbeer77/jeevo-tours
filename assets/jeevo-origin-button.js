/**
 * Jeevo Tours - Origin Button Effect
 * Vanilla JavaScript implementation with orange/white theme
 */

(function() {
    'use strict';

    class OriginButton {
        constructor(button) {
            this.button = button;
            this.fillElement = null;
            this.origin = { x: 0, y: 0 };
            this.coverSize = 0;
            this.isHovered = false;
            this.isPressed = false;

            this.init();
        }

        init() {
            // Add origin button class
            this.button.classList.add('jv-origin-btn-enhanced');

            // Create fill element
            this.fillElement = document.createElement('span');
            this.fillElement.className = 'jv-origin-btn__fill';
            this.fillElement.setAttribute('aria-hidden', 'true');

            // Wrap existing content
            const content = this.button.innerHTML;
            this.button.innerHTML = '';

            const contentWrapper = document.createElement('span');
            contentWrapper.className = 'jv-origin-btn__content';
            contentWrapper.innerHTML = content;

            this.button.appendChild(this.fillElement);
            this.button.appendChild(contentWrapper);

            // Bind events
            this.attachEvents();
        }

        attachEvents() {
            this.button.addEventListener('pointerenter', this.handlePointerEnter.bind(this));
            this.button.addEventListener('pointerleave', this.handlePointerLeave.bind(this));
            this.button.addEventListener('pointerdown', this.handlePointerDown.bind(this));
            this.button.addEventListener('pointerup', this.handlePointerUp.bind(this));
            this.button.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
            this.button.addEventListener('focus', this.handleFocus.bind(this));
            this.button.addEventListener('blur', this.handleBlur.bind(this));
            this.button.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.button.addEventListener('keyup', this.handleKeyUp.bind(this));
        }

        getCoverDiameter(width, height, x, y) {
            return Math.ceil(
                2 * Math.max(
                    Math.hypot(x, y),
                    Math.hypot(width - x, y),
                    Math.hypot(x, height - y),
                    Math.hypot(width - x, height - y)
                )
            );
        }

        updateOrigin(x, y) {
            const rect = this.button.getBoundingClientRect();
            this.origin = { x, y };
            this.coverSize = this.getCoverDiameter(rect.width, rect.height, x, y);
            this.updateFillPosition();
        }

        updateOriginFromPointer(event) {
            const rect = this.button.getBoundingClientRect();
            this.updateOrigin(event.clientX - rect.left, event.clientY - rect.top);
        }

        updateOriginFromCenter() {
            const rect = this.button.getBoundingClientRect();
            this.updateOrigin(rect.width / 2, rect.height / 2);
        }

        updateFillPosition() {
            this.fillElement.style.left = `${this.origin.x}px`;
            this.fillElement.style.top = `${this.origin.y}px`;
            this.fillElement.style.width = `${this.coverSize}px`;
            this.fillElement.style.height = `${this.coverSize}px`;
        }

        showFill() {
            if (this.button.disabled) return;

            const shouldShow = this.isHovered || this.isPressed;
            this.button.setAttribute('data-fill-active', shouldShow ? 'true' : 'false');
        }

        handlePointerEnter(event) {
            if (this.button.disabled) return;
            this.updateOriginFromPointer(event);
            this.isHovered = true;
            this.showFill();
        }

        handlePointerLeave() {
            this.isHovered = false;
            this.isPressed = false;
            this.showFill();
        }

        handlePointerDown(event) {
            if (this.button.disabled || event.button !== 0) return;
            this.updateOriginFromPointer(event);
            this.isPressed = true;
            this.isHovered = true;
            this.showFill();
        }

        handlePointerUp() {
            this.isPressed = false;
            this.showFill();
        }

        handlePointerCancel() {
            this.isPressed = false;
            this.showFill();
        }

        handleFocus(event) {
            if (this.button.disabled) return;
            if (this.button.matches(':focus-visible')) {
                this.updateOriginFromCenter();
                this.isHovered = true;
                this.showFill();
            }
        }

        handleBlur() {
            this.isPressed = false;
            this.isHovered = false;
            this.showFill();
        }

        handleKeyDown(event) {
            if (this.button.disabled || event.repeat) return;

            if (event.key === ' ' || event.key === 'Enter') {
                if (event.key === ' ') {
                    event.preventDefault();
                }
                this.updateOriginFromCenter();
                this.isPressed = true;
                this.isHovered = true;
                this.showFill();
            }
        }

        handleKeyUp(event) {
            if (event.key === ' ' || event.key === 'Enter') {
                this.isPressed = false;
                if (!this.button.matches(':focus-visible')) {
                    this.isHovered = false;
                }
                this.showFill();
            }
        }
    }

    // Initialize all origin buttons
    function initOriginButtons() {
        const buttons = document.querySelectorAll('.jv-origin-btn:not(.jv-origin-btn-enhanced)');
        buttons.forEach(button => new OriginButton(button));
    }

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOriginButtons);
    } else {
        initOriginButtons();
    }

    // Export for manual initialization
    window.JeevoOriginButton = {
        init: initOriginButtons,
        OriginButton: OriginButton
    };
})();
