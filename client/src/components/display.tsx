import { createRef, h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import Guacamole, { Keyboard, Mouse } from 'guacamole-common-js';
import { RemoteDesktop } from '../services/remote-desktop';

interface Props {
  client?: Guacamole.Client;
  withControl?: boolean;
}
export const Display = ({ client, withControl }: Props) => {
  const hasFocusRef = createRef<boolean>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to RemoteDesktop events
  useEffect(() => {
    console.log('[Display] Subscribing to RemoteDesktop events');

    //
    // Set the mouse handler
    function mountMouseHandler(client: Guacamole.Client) {
      console.log('[Display] Mounting mouse handler');
      const display = client.getDisplay();
      const displayEl = display.getElement() as HTMLDivElement;

      // Set the mouse handler
      function onMouseMove(mouseState: Mouse.State) {
        const scaledMouseState = Object.assign({}, mouseState, {
          x: mouseState.x / display.getScale(),
          y: mouseState.y / display.getScale(),
        });
        client?.sendMouseState(scaledMouseState);
      }
      const mouse = new Mouse(displayEl);
      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = onMouseMove;

      // Set focus listener
      displayEl.addEventListener('mouseenter', () => setFocus(true));
      displayEl.addEventListener('mouseleave', () => setFocus(false));

      // Set focus and set cursor
      function setFocus(focused: boolean) {
        hasFocusRef.current = focused;
        if (focused) displayEl.classList.add('cursor-none');
        else displayEl.classList.remove('cursor-none');
      }
    }

    //
    // Set the keyboard handler
    function mountKeyboardHandler(client: Guacamole.Client) {
      console.log('[Display] Mounting keyboard handler');
      // const display = client.getDisplay();
      // const displayEl = display.getElement();

      // Configure keyboard
      const keyboard = new Keyboard(document);
      keyboard.onkeydown = (e) => {
        client.sendKeyEvent(1, e);
        return true;
      };
      keyboard.onkeyup = (e) => {
        client.sendKeyEvent(0, e);
        return true;
      };

      document.addEventListener(
        'keydown',
        (e) => {
          if (hasFocusRef.current) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        },
        false
      );
    }

    function onResize() {
      if (!containerRef.current) return;
      // Set width / height
      const width = containerRef.current.offsetWidth;
      const widthScale = width / 1920;
      const height = containerRef.current.offsetHeight;
      const heightScale = height / 1080;
      console.log(`[Display] Container size ${width}x${height} scaling ${widthScale}x${heightScale}`);
      display.scale(Math.min(widthScale, heightScale));
    }

    // Fired when the remote desktop is ready to be used
    if (!containerRef.current || !client) return;
    console.log('[Display] rendering new client');

    // Set the container contents
    const display = client.getDisplay();
    const displayEl = display.getElement();
    containerRef.current.replaceChildren(displayEl);
    displayEl.focus();

    onResize();
    window.addEventListener('resize', onResize);

    // Mount handlers
    if (withControl === true) {
      console.log('[Display] Mounting handlers');
      mountKeyboardHandler(client);
      mountMouseHandler(client);
    }

    return () => {
      // TODO: unmount handlers
      window.removeEventListener('resize', onResize);
    };
  }, [client]);

  return <div ref={containerRef} className='w-screen h-screen' />;
};
