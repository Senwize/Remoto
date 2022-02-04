import { createRef, h, render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import Guacamole from 'guacamole-common-js';

export const Client = () => {
  const [isConnected, setConnected] = useState(false);
  const displayContainerRef = createRef<HTMLDivElement>();
  const guacRef = createRef<Guacamole.Client>();
  const tunnelRef = createRef<Guacamole.Tunnel>();
  const hasFocusRef = createRef<boolean>();

  useEffect(() => {
    const tunnel = new Guacamole.WebSocketTunnel(`ws://${location.host}/websocket-tunnel`);
    const guac = new Guacamole.Client(tunnel);

    // Update references
    guacRef.current = guac;
    tunnelRef.current = tunnel;

    // Register listeners
    tunnel.onerror = (e) => console.error('[tunnel] error: ', e);
    tunnel.onstatechange = (state) => console.log('[tunnel] state: ', state);
    guac.onerror = (e) => {
      console.error('[guac] error: ', e);
      setConnected(false);
    };
    guac.onstatechange = (state) => {
      console.log('[guac] state: ', state);
      if (state === 3 /* connected */) {
        setConnected(true);
      }
    };
    window.onunload = () => guac.disconnect();

    // render dispaly
    if (!displayContainerRef.current) {
      console.error('[client] display container ref is null');
      return;
    }
    const displayEl = guac.getDisplay().getElement() as HTMLDivElement;
    displayContainerRef.current.appendChild(displayEl);

    // Configure mouse
    const mouse = new Guacamole.Mouse(displayEl);
    mouse.onmousedown =
      mouse.onmouseup =
      mouse.onmousemove =
        (e) => {
          guac.sendMouseState(e);
        };

    // Configure keyboard
    const keyboard = new Guacamole.Keyboard(document);
    keyboard.onkeydown = (e) => {
      guac.sendKeyEvent(1, e);
      return true;
    };
    keyboard.onkeyup = (e) => {
      guac.sendKeyEvent(0, e);
      return true;
    };

    // Disable events
    const disableEvent = (e: Event) => {
      e.stopPropagation();
      if (e.preventDefault) {
        e.preventDefault();
      }
      return false;
    };
    displayEl.addEventListener('contextmenu', disableEvent);

    // Disable save, print
    displayEl.addEventListener('mouseenter', () => {
      console.log('focus: true');
      displayEl.classList.add('cursor-none');
      hasFocusRef.current = true;
    });
    displayEl.addEventListener('mouseleave', () => {
      console.log('focus: false');
      displayEl.classList.remove('cursor-none');
      hasFocusRef.current = false;
    });

    document.addEventListener(
      'keydown',
      (e) => {
        console.log(`[keydown] ${e.key} ${hasFocusRef.current}`);
        if (hasFocusRef.current) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      },
      false
    );

    displayEl.focus();

    return () => {
      guac.disconnect();
    };
  }, []);

  const p = document.createElement('h1');
  p.innerText = 'Hey';

  return (
    <div className='h-screen w-screen'>
      {!isConnected ? (
        <a
          href='#'
          onClick={(e) => {
            e.preventDefault();
            if (guacRef.current) guacRef.current.connect(undefined);
          }}
        >
          Connect
        </a>
      ) : undefined}
      <div ref={displayContainerRef} />
    </div>
  );
};
