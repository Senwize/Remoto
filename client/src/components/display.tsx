import { createRef, h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import Guacamole, { Keyboard, Mouse } from 'guacamole-common-js';
import { RemoteDesktop } from '../services/remote-desktop';

interface Props {
  remote: RemoteDesktop;
}
export const Display = ({ remote }: Props) => {
  const hasFocusRef = createRef<boolean>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to RemoteDesktop events
  useEffect(() => {
    console.log('[Display] Subscribing to RemoteDesktop events');

    //
    // Set the mouse handler
    function mountMouseHandler(client: Guacamole.Client) {
      const display = client.getDisplay();
      const displayEl = display.getElement();

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

    // Fired when the remote desktop is ready to be used
    function onConnect(client: Guacamole.Client) {
      console.log('[Display] connected');
      if (!containerRef.current || !client) return;
      console.log('[Display] rendering and mounting');

      // Set the container contents
      const display = client.getDisplay();
      const displayEl = display.getElement();
      containerRef.current.replaceChildren(displayEl);
      displayEl.focus();
      display.scale(0.8);

      // Mount handlers
      mountKeyboardHandler(client);
      mountMouseHandler(client);
    }

    remote.addListener('connect', onConnect);
    // remote.addListener('disconnect', onDisconnect);

    // Remove listeners
    return () => {
      remote.removeListener('connect', onConnect);
      // remote.removeListener('disconnect', onDisconnect);
    };
  }, [containerRef]);

  return <div ref={containerRef} className='w-screen h-screen' />;
};
